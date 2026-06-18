// landing-editor/lib/trackingIssues.ts
// tracking 字段的发布门禁校验：宽松策略——启用且填了 ID，但含空白字符即视为非法。
import type { LandingPageDraft, PixelProvider } from "@/types/schema.draft";

const PROVIDER_LABEL: Record<PixelProvider, string> = {
  meta: "Meta Pixel",
  ga4: "Google Analytics（GA4）",
  googleAds: "Google Ads",
  tiktok: "TikTok Pixel",
};

export function collectTrackingIssues(draft: LandingPageDraft): string[] {
  const pixels = draft.tracking?.pixels ?? [];
  const out: string[] = [];
  for (const p of pixels) {
    if (!p.enabled) continue;
    const id = p.id.trim();
    if (!id) continue; // 启用但留空：视为未配置，不报错
    if (/\s/.test(p.id)) out.push(`${PROVIDER_LABEL[p.provider]}：ID 不应包含空格`);
  }
  return [...new Set(out)];
}
