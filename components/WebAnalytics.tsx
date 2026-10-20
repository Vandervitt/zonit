"use client";

import { Analytics } from "@vercel/analytics/next";
import { webAnalyticsBeforeSend } from "@/lib/analytics/web-analytics-filter";

// beforeSend 是函数，不能从服务端根布局直接传给客户端组件，故在此包一层。
export function WebAnalytics() {
  return <Analytics beforeSend={webAnalyticsBeforeSend} />;
}
