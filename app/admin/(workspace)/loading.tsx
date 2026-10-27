"use client";

import { Skeleton } from "antd";

// 路由级加载态：菜单预取尚未完成就点击时（慢网常见），先立即切到骨架屏，
// 而不是停在原页面干等服务端往返。
export default function Loading() {
  return <Skeleton active paragraph={{ rows: 8 }} />;
}
