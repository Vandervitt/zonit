import type { LandingPageDraft } from "@/types/schema.draft";
import type { GenerationBrief, RewriteRequest, RewriteResult, FilledSlot } from "./types";
import { deriveSlots, mergeSlots } from "./slots";
import { buildSystemPrompt, buildFillUserPrompt, buildRewriteUserPrompt, slotFillJsonSchema, rewriteJsonSchema } from "./prompt";
import { checkDraftCompliance, filterCandidates, type ComplianceReason } from "./guardrails";
import { buildImageQueryPrompt, imageQueryJsonSchema, type ImageSlot, type FilledImage } from "./images";
import { getAiClient } from "./client";

export type GenerateResult =
  | { ok: true; draft: LandingPageDraft }
  | { ok: false; reason: ComplianceReason | "model_error"; detail?: string };

const REWRITE_CANDIDATES = 3;

/** 整页：抽槽→填→合并→校验，失败自动重试 1 次。 */
export async function generateDraftFromBrief(
  template: LandingPageDraft,
  brief: GenerationBrief,
): Promise<GenerateResult> {
  const slots = deriveSlots(template);
  const system = buildSystemPrompt();
  const user = buildFillUserPrompt(brief, slots);
  const client = getAiClient();

  let last: GenerateResult = { ok: false, reason: "model_error" };
  for (let attempt = 0; attempt < 2; attempt++) {
    let filled: FilledSlot[] = [];
    try {
      const out = await client.completeJson<{ slots: FilledSlot[] }>({
        system, user: attempt === 0 ? user : `${user}\n\n上次产出含违规或不合法内容，请严格遵守规则重试。`,
        schema: slotFillJsonSchema(), schemaName: "slot_fill",
      });
      filled = out.slots ?? [];
    } catch (e) {
      last = { ok: false, reason: "model_error", detail: String(e) };
      continue;
    }
    const draft = mergeSlots(template, filled);
    const compliance = checkDraftCompliance(draft);
    if (compliance.ok) return { ok: true, draft };
    last = { ok: false, reason: compliance.reason ?? "invalid_structure", detail: compliance.detail };
  }
  return last;
}

/** 自动配图：为给定图片槽产出 Unsplash 检索词 + alt（网络换图在路由层完成）。 */
export async function generateImageQueries(brief: GenerationBrief, slots: ImageSlot[]): Promise<FilledImage[]> {
  const out = await getAiClient().completeJson<{ images: FilledImage[] }>({
    system: buildSystemPrompt(),
    user: buildImageQueryPrompt(brief, slots),
    schema: imageQueryJsonSchema(),
    schemaName: "image_queries",
  });
  return out.images ?? [];
}

/** 区块改写：产出候选并剔除禁词。 */
export async function rewriteText(req: RewriteRequest): Promise<RewriteResult> {
  const out = await getAiClient().completeJson<{ candidates: string[] }>({
    system: buildSystemPrompt(),
    user: buildRewriteUserPrompt(req, REWRITE_CANDIDATES),
    schema: rewriteJsonSchema(), schemaName: "rewrite",
  });
  return { candidates: filterCandidates(out.candidates ?? []) };
}
