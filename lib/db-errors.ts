// lib/db-errors.ts
// pg 驱动错误的分类。用于区分「这条数据本来就没救」与「数据库出故障了」——
// 后者绝不能被静默丢弃（历史事故：留资落库失败仍返回 204，线索静默蒸发）。

/**
 * 坏 page_id 的 pg 错误码：外键违约（23503）与非法 uuid 字面量（22P02）。
 * 这两类记录没有归属页面，重投也永远失败，可安全丢弃。
 */
const BAD_PAGE_ID_CODES = new Set(["23503", "22P02"]);

export function isBadPageIdError(err: unknown): boolean {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === "string" && BAD_PAGE_ID_CODES.has(code);
}
