import type { PlanId } from "@/lib/plans";
import { PLANS } from "@/lib/plans";
import type { PageTracking } from "@/types/schema.draft";

/**
 * 按套餐门控页面追踪配置，两级：
 * - free/starter（basicPixel && !advancedTracking）：只保留 Meta 客户端 pixel，
 *   剥离 TikTok/GA4/GoogleAds 与服务端 CAPI（serverSide）——即「基础数据追踪 (1× Meta Pixel)」，
 *   让免费用户也能跑小额投放、体验核心价值后再升级。
 * - pro/agency（advancedTracking）：原样返回全矩阵能力。
 * 注：!basicPixel（剥离全部像素）的分支保留以防未来新增更低档位，当前四档无一命中。
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
