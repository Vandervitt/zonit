import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";
import { getTemplate } from "@/landing-editor/samples/registry";
import { loadTemplateDraft } from "@/landing-editor/samples/registry.drafts";
import {
  createLandingPage,
  listLandingPages,
  getLandingPage,
  updateLandingPageDraft,
  ensureUniqueName,
} from "@/lib/landing-pages/store";
import { getUserPlan } from "@/lib/plans-db";
import { PLANS } from "@/lib/plans";
import { generateDraftFromBrief, generateImageQueries } from "@/lib/ai/generate";
import { deriveImageSlots, mergeImages, buildImageReplacements, MAX_AUTO_IMAGES } from "@/lib/ai/images";
import { searchTopPhoto, searchPhotoAt, persistUnsplashPhoto } from "@/lib/media/unsplash";
import { checkAndConsume, hasAllowance } from "@/lib/ai/usage";
import type { GenerationBrief } from "@/lib/ai/types";
import type { LandingPageDraft } from "@/types/schema.draft";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const userId = session.user.id;

  const body = (await request.json()) as {
    templateId?: string;
    pageId?: string;
    brief?: GenerationBrief;
  };
  if (!body.brief?.productName || !body.brief?.description) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }
  // 输入长度上限：限制送入模型的文本规模，控制 token 成本与提示注入面。
  const b = body.brief;
  if (
    b.productName.length > 200 ||
    b.description.length > 4000 ||
    (b.pastedIntro?.length ?? 0) > 8000 ||
    (b.targetAudience?.length ?? 0) > 500 ||
    (b.tone?.length ?? 0) > 200 ||
    (b.ctaGoal?.length ?? 0) > 200
  ) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  const plan = await getUserPlan(userId);

  // 两种模式：
  // - 编辑器内（body.pageId）：为「已建好的空白落地页」原地生成文案；base 用该页当前草稿，
  //   不占用「新建数量」名额，成功后落库并把生成结果回传给编辑器灌入 store（前端 autosave 兜底）。
  // - 旧建页模式（无 pageId）：按模板新建一张落地页（保留兼容，受落地页数量上限约束）。
  const inEditor = typeof body.pageId === "string" && body.pageId.length > 0;

  // 落地页数量上限仅约束「新建」；编辑器内原地生成不新增页面，跳过该校验。
  if (!inEditor) {
    const pageLimit = PLANS[plan].landingPagesLimit;
    if (pageLimit !== Infinity) {
      const existing = await listLandingPages(userId);
      if (existing.length >= pageLimit) {
        return NextResponse.json({ error: ApiErrors.LIMIT_EXCEEDED }, { status: 403 });
      }
    }
  }

  // AI 额度只读预检：无额度则直接拒绝，避免为无额度用户白跑（付费的）模型
  const quota = PLANS[plan].aiPageQuota;
  if (!(await hasAllowance(pool, userId, "page", quota))) {
    return NextResponse.json(
      { error: ApiErrors.AI_QUOTA_EXHAUSTED, hints: { upgrade: "/pricing", topup: "/admin/billing" } },
      { status: 403 },
    );
  }

  // base 草稿来源：编辑器内取该页当前草稿（越权则 404）；否则按模板加载。
  let baseDraft: LandingPageDraft;
  if (inEditor) {
    const page = await getLandingPage(body.pageId!, userId);
    if (!page) {
      return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
    }
    baseDraft = page.data;
  } else {
    baseDraft = await loadTemplateDraft(body.templateId); // 草稿体按需加载
  }

  // 生成（失败不扣额度）
  const result = await generateDraftFromBrief(baseDraft, body.brief);
  if (!result.ok) {
    return NextResponse.json(
      { error: ApiErrors.AI_GENERATION_FAILED, reason: result.reason },
      { status: 422 },
    );
  }

  // 成功后扣额度（月额度优先，满则扣 credit）；并发耗尽时拒绝
  const consumed = await checkAndConsume(pool, userId, "page", quota);
  if (!consumed.ok) {
    return NextResponse.json(
      { error: ApiErrors.AI_QUOTA_EXHAUSTED, hints: { upgrade: "/pricing", topup: "/admin/billing" } },
      { status: 403 },
    );
  }

  // 自动配图（尽力而为）：据 brief 为图片位换 Unsplash 图并写 alt；任何失败都回退文本版 draft。
  const finalDraft = await applyAutoImages(result.draft, body.brief, userId);

  if (inEditor) {
    // 原地落库；同时回传 draft 供编辑器灌入 store（若前端未及时 autosave，DB 已是新内容）。
    await updateLandingPageDraft(body.pageId!, userId, { data: finalDraft });
    return NextResponse.json({ id: body.pageId, draft: finalDraft }, { status: 200 });
  }

  const template = getTemplate(body.templateId);
  const name = await ensureUniqueName(userId, `${template.name} (AI)`);
  const row = await createLandingPage(userId, name, finalDraft);
  return NextResponse.json(row, { status: 201 });
}

/**
 * 自动配图：AI 出检索词 → Unsplash 取首图 → 存 Blob → 写回 src/alt。
 * 全程尽力而为——未开启、无 Unsplash key、任一步失败，都返回原（文本版）draft，绝不阻断生成。
 * 同一检索词只下载一次（去重），并受 MAX_AUTO_IMAGES 数量上限约束。
 */
async function applyAutoImages(
  draft: LandingPageDraft,
  brief: GenerationBrief,
  userId: string,
): Promise<LandingPageDraft> {
  if (brief.autoImages === false) return draft;
  if (!process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY === "your_access_key_here") return draft;

  try {
    const slots = deriveImageSlots(draft, MAX_AUTO_IMAGES);
    if (slots.length === 0) return draft;

    const plan = await generateImageQueries(brief, slots);
    // 头像逐个换脸：用递增计数从结果池取不同图，即使模型给了相同检索词也不撞脸。
    let avatarSeq = 0;
    // 单图解析：Unsplash 取图 → 存 Blob；无结果 / 失败返回 null（该图保留原图）。
    const replacements = await buildImageReplacements(slots, plan, async (query, slot) => {
      const photo =
        slot.kind === "avatar"
          ? await searchPhotoAt(query, avatarSeq++, "squarish") // 人像取向、逐个取不同结果
          : await searchTopPhoto(query); // 普通/对比图：landscape 首图
      if (!photo) return null;
      try {
        const saved = await persistUnsplashPhoto(userId, {
          downloadLocation: photo.downloadLocation,
          imageUrl: photo.urls.regular,
          creditName: photo.user.name,
          creditUrl: photo.user.profileUrl,
        });
        if (!saved || "error" in saved) return null;
        return { src: saved.item.url, alt: photo.alt_description ?? undefined };
      } catch {
        return null;
      }
    });

    return replacements.length ? mergeImages(draft, replacements) : draft;
  } catch {
    return draft; // 出错整段回退，保证「有文案结果」优先
  }
}
