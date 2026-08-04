// 已发布页的线上地址解析（纯函数）。
//
// 自检器要检查的是**访客真正看到的那张页**，所以必须走绑定域名 + 路径，
// 不能拿预览地址凑数：预览走的是平台主域与另一套渲染入口，检查它等于检查了
// 一个访客永远打不开的 URL，结论也就没有意义。

export interface LivePageLocation {
  status: string;
  bound_domain: string | null;
  bound_path: string | null;
}

export type LiveUrlResult =
  | { ok: true; url: string }
  | { ok: false; reason: "not_published" | "no_domain" };

export function resolveLiveUrl(page: LivePageLocation): LiveUrlResult {
  if (page.status !== "published") return { ok: false, reason: "not_published" };
  if (!page.bound_domain) return { ok: false, reason: "no_domain" };
  const path = page.bound_path && page.bound_path !== "/" ? page.bound_path : "";
  return { ok: true, url: `https://${page.bound_domain}${path}` };
}
