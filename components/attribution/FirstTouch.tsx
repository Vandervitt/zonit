"use client";

import { useEffect } from "react";
import { ApiRoutes } from "@/lib/constants";
import {
  buildFirstTouch,
  FIRST_TOUCH_KEY,
  FIRST_TOUCH_REPORTED_KEY,
} from "@/lib/attribution/signup-source";

// 平台主站 origin；客户自定义域名与平台子域上 buildFirstTouch 会直接返回 null。
const SITE_ORIGIN = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://urgizat.com").origin;

// localStorage 在隐私模式、被禁用站点数据时会抛错；归因丢了无妨，绝不能影响页面。
function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 忽略
  }
}

/** 根布局：访客第一次落在平台营销站时记下来源，之后不覆盖（首触）。 */
export function FirstTouchCapture() {
  useEffect(() => {
    const touch = buildFirstTouch({
      href: window.location.href,
      referrer: document.referrer,
      siteOrigin: SITE_ORIGIN,
      now: new Date(),
    });
    if (!touch || readStorage(FIRST_TOUCH_KEY)) return;
    writeStorage(FIRST_TOUCH_KEY, JSON.stringify(touch));
  }, []);
  return null;
}

/**
 * 后台：把首触来源补报一次。服务端只在注册后窗口期内、且尚无来源时写入，
 * 所以老用户换设备补报也不会改写；收到明确答复（含 400）即标记已报，网络失败下次再试。
 */
export function SignupSourceReporter() {
  useEffect(() => {
    const touch = readStorage(FIRST_TOUCH_KEY);
    if (!touch || readStorage(FIRST_TOUCH_REPORTED_KEY)) return;
    fetch(ApiRoutes.SignupSource, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: touch,
    })
      .then((res) => {
        if (res.ok || res.status === 400) writeStorage(FIRST_TOUCH_REPORTED_KEY, "1");
      })
      .catch(() => {});
  }, []);
  return null;
}
