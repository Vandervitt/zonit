"use client";

import { Menu } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { Routes } from "@/lib/constants";
import { HELP_CHAPTERS } from "../_content";

/** 帮助中心侧边目录：概览 + 12 章。选中态按当前路径解析。 */
export function HelpNav() {
  const pathname = usePathname();
  const router = useRouter();
  const activeKey =
    pathname === Routes.Help
      ? "overview"
      : HELP_CHAPTERS.find((c) => pathname === `${Routes.Help}/${c.slug}`)?.slug ?? "overview";

  return (
    <Menu
      mode="inline"
      selectedKeys={[activeKey]}
      style={{ borderInlineEnd: 0, background: "transparent" }}
      onClick={({ key }) =>
        router.push(key === "overview" ? Routes.Help : `${Routes.Help}/${key}`)
      }
      items={[
        { key: "overview", label: "帮助首页" },
        ...HELP_CHAPTERS.map((c) => ({ key: c.slug, label: c.title })),
      ]}
    />
  );
}
