// lib/tools/visitor.ts
//
// 从请求头取访客标识，供报告页记录浏览。
//
// 单独成文件而不是放进 store.ts：store 被 API route 直接引用，
// 而 next/headers 只能在请求上下文里用——混在一起会把限制传染给所有调用方。
import { headers } from "next/headers";
import type { Visitor } from "./store";

/**
 * 与 /api/tools/page-check 取 IP 的口径保持一致：取 x-forwarded-for 的第一段。
 * 拿不到时用 "unknown"——它同样会被哈希，效果是所有匿名访问归到同一个桶，
 * 不影响「有没有人打开」的判断，只影响独立访客计数，这个取舍可以接受。
 */
export async function currentVisitor(): Promise<Visitor> {
  const h = await headers();
  return {
    ip: (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown",
    userAgent: h.get("user-agent"),
  };
}
