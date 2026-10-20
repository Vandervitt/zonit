"use client";

import { useEffect } from "react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * 从中文登录/注册页进入的用户，把 zh 记进语言 cookie（仅在尚未选择过语言时）。
 *
 * 后台语言按「用户设置 > zb_locale > 默认英文」解析（resolveAdminLocale），而这个 cookie
 * 原先只有手动点语言切换器才会写——经 /zh 链接或首页地域分流进来的中文访客从来没有它，
 * 注册后一律落进英文后台。只在中文入口写：英文入口是代理在无任何语言信号时的默认落点，
 * 在那里写 en 反而会把大陆用户钉死在英文。
 */
export function useRememberZhEntry(locale: Locale) {
  useEffect(() => {
    if (locale !== "zh") return;
    const hasChoice = document.cookie.split("; ").some((c) => c.startsWith(`${LOCALE_COOKIE}=`));
    if (hasChoice) return;
    document.cookie = `${LOCALE_COOKIE}=zh; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  }, [locale]);
}
