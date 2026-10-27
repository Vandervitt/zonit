"use client";

import { Skeleton } from "antd";

// 路由级加载态：超管各页在服务端查库渲染，没有它时动态路由不预取，点击菜单后要干等
// 一次完整往返画面才动。有了它 <Link> 会预取到这一层，点击立即出骨架、数据随后流入。
// 刻意不对超管菜单做完整预取：那会在每次进后台时把各页的聚合 SQL 全跑一遍。
export default function Loading() {
  return <Skeleton active paragraph={{ rows: 8 }} />;
}
