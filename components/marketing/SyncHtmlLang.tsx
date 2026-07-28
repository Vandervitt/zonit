"use client";

import { useEffect } from "react";

/**
 * 把 <html lang> 同步为当前子树语言（仅影响客户端 DOM，SSR 首帧不变）。
 * 根布局是全站唯一能输出 <html> 的地方，而 /zh 子树与 / 共用它，故只能在
 * 客户端补齐——搜索引擎侧的语言信号由 hreflang + og:locale + JSON-LD inLanguage 承担。
 */
export function SyncHtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [lang]);
  return null;
}
