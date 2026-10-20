// landing-renderer/preview.ts
// 预览模式：false = 线上渲染；否则为预览，值是看预览的人（运营者）的界面语言。
//
// 为什么不是 boolean + context：渲染器同时用于线上 /p 页（服务端组件），用不了 useContext；
// 把语言并进 preview 值里，原有的 `if (!preview)` 判断一处不用改，类型检查会逼着每个入口
// 显式给出语言，不会再出现英文后台里冒出「线上不显示」的情况。
import type { Locale } from "@/lib/i18n/config";

export type PreviewMode = false | Locale;

/** 预览占位里写给运营者看的提示（不是页面内容，线上永不渲染）。 */
export const PREVIEW_LABELS: Record<Locale, {
  contactMissing: string;
  textMissing: string;
  separator: string;
  notLive: string;
  ctaFallback: string;
  floatingFallback: string;
}> = {
  zh: {
    contactMissing: "联系方式未填",
    textMissing: "文案未填",
    separator: "、",
    notLive: "线上不显示",
    ctaFallback: "CTA 按钮",
    floatingFallback: "悬浮按钮",
  },
  en: {
    contactMissing: "Contact not set",
    textMissing: "text not set",
    separator: ", ",
    notLive: "hidden when live",
    ctaFallback: "CTA button",
    floatingFallback: "Floating button",
  },
};
