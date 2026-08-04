// lib/preview/load.ts
// 预览 token → 页面。落地页预览与其政策子页预览共用同一份校验，
// 两处各写一遍迟早出现「主页面校验严、子页校验松」的越权口子。
import { getPageForPreview } from "@/lib/landing-pages/store";
import { decodePageId, verifyPreviewToken } from "@/lib/preview/token";

/** 校验 token → 取页。任何失败一律返回 null（调用方 notFound，不泄露页面是否存在）。 */
export async function loadValidPreview(token: string) {
  const pageId = decodePageId(token);
  if (!pageId) return null;
  const page = await getPageForPreview(pageId);
  if (!page || !page.preview_secret || page.owner_disabled) return null;
  const ok = verifyPreviewToken({
    token,
    previewSecret: page.preview_secret,
    authSecret: process.env.AUTH_SECRET ?? "",
    nowMs: Date.now(),
  });
  return ok ? page : null;
}
