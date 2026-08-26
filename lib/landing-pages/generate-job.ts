// AI 一键成页的生成主体：文案生成→扣额度→自动配图。
// 从 app/api/landing-pages/generate/route.ts 抽出来，供「编辑器内异步任务」与
// 「旧建页模式（同步，兼容保留）」两条路径共用，避免逻辑分叉。
import * as Sentry from "@sentry/nextjs";
import pool from "@/lib/db";
import { generateDraftFromBrief, generateImageQueries } from "@/lib/ai/generate";
import { deriveImageSlots, mergeImages, buildImageReplacements, MAX_AUTO_IMAGES } from "@/lib/ai/images";
import { searchTopPhoto, searchPhotoAt, persistUnsplashPhoto } from "@/lib/media/unsplash";
import { checkAndConsume } from "@/lib/ai/usage";
import { updateLandingPageDraft } from "@/lib/landing-pages/store";
import { markAiJobDone } from "@/lib/landing-pages/ai-jobs";
import type { GenerationBrief } from "@/lib/ai/types";
import type { LandingPageDraft } from "@/types/schema.draft";

export type PerformGenerationResult =
  | { ok: true; draft: LandingPageDraft }
  | { ok: false; reason: string };

/**
 * 自动配图：AI 出检索词 → Unsplash 取首图 → 存 Blob → 写回 src/alt。
 * 全程尽力而为——未开启、无 Unsplash key、任一步失败，都返回原（文本版）draft，绝不阻断生成。
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
    let avatarSeq = 0;
    const replacements = await buildImageReplacements(slots, plan, async (query, slot) => {
      const photo =
        slot.kind === "avatar" ? await searchPhotoAt(query, avatarSeq++, "squarish") : await searchTopPhoto(query);
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

/** 文案生成 + 扣额度 + 自动配图。不落库、不碰 job 表——纯计算+外部调用。 */
export async function performGeneration(
  baseDraft: LandingPageDraft,
  brief: GenerationBrief,
  userId: string,
  quota: number,
): Promise<PerformGenerationResult> {
  const result = await generateDraftFromBrief(baseDraft, brief);
  if (!result.ok) {
    return { ok: false, reason: result.reason };
  }

  const consumed = await checkAndConsume(pool, userId, "page", quota);
  if (!consumed.ok) {
    return { ok: false, reason: consumed.reason };
  }

  const finalDraft = await applyAutoImages(result.draft, brief, userId);
  return { ok: true, draft: finalDraft };
}

/**
 * 编辑器内异步任务：在 `after()` 里跑，跑完落库并把 job 标终态。
 * ⚠️ 必须自己兜住所有异常——这是后台任务，没有 HTTP 响应能把错误带回给谁，
 * 不兜住 job 就会永远卡在 pending，前端轮询轮到天荒地老。
 */
export async function runGenerationJob(args: {
  jobId: string;
  pageId: string;
  userId: string;
  baseDraft: LandingPageDraft;
  brief: GenerationBrief;
  quota: number;
}): Promise<void> {
  const { jobId, pageId, userId, baseDraft, brief, quota } = args;
  try {
    const result = await performGeneration(baseDraft, brief, userId, quota);
    if (!result.ok) {
      Sentry.captureException(new Error(`AI generation failed: ${result.reason}`), {
        tags: { route: "landing-pages/generate", stage: "generate", reason: result.reason },
        extra: { jobId, pageId, userId },
      });
      await markAiJobDone(jobId, "failed", result.reason);
      return;
    }
    await updateLandingPageDraft(pageId, userId, { data: result.draft });
    await markAiJobDone(jobId, "succeeded");
  } catch (err) {
    // 兜底：generateDraftFromBrief/checkAndConsume/updateLandingPageDraft 之外的任何意外抛错
    // （DB 连接失败等），同样必须让 job 落到终态，不能让前端轮询永远等不到结果。
    Sentry.captureException(err, {
      tags: { route: "landing-pages/generate", stage: "job_runner" },
      extra: { jobId, pageId, userId },
    });
    await markAiJobDone(jobId, "failed", "unexpected_error").catch(() => {
      // job 表都写不进去（比如连接池耗尽），只能再报一次 Sentry；
      // 前端会在轮询超时后自行提示失败，不依赖这次落库成功。
      Sentry.captureException(err, { tags: { route: "landing-pages/generate", stage: "mark_done_failed" } });
    });
  }
}
