import type { PlanId } from "@/lib/plans";
import { PLANS } from "@/lib/plans";
import type { PageTracking } from "@/types/schema.draft";

/**
 * 按套餐门控页面追踪配置，三级：
 * - free（!basicPixel）：剥离全部像素与服务端 CAPI —— 免费版不含任何数据追踪。
 * - starter（basicPixel && !advancedTracking）：只保留 Meta 客户端 pixel，
 *   剥离 TikTok/GA4/GoogleAds 与服务端 CAPI（serverSide）——即「基础数据追踪 (1× Meta Pixel)」。
 * - pro/agency（advancedTracking）：原样返回全矩阵能力。
 * 纯函数，发布页渲染前调用；是追踪门控的权威边界（编辑器 UI 仅作提示）。
 */
export function gateTrackingByPlan(
  tracking: PageTracking | undefined,
  plan: PlanId,
): PageTracking | undefined {
  if (!tracking) return tracking;
  const cfg = PLANS[plan];
  if (cfg.advancedTracking) return tracking;
  if (!cfg.basicPixel) return { ...tracking, pixels: [] };
  const pixels = (tracking.pixels ?? [])
    .filter((p) => p.provider === "meta")
    .map((p) => ({ ...p, serverSide: false }));
  return { ...tracking, pixels };
}
