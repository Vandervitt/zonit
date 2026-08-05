"use client";

import { Menu } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { Routes } from "@/lib/constants";
import { getHelpChapters } from "../_content";
import { useAdminT, useAdminLocale } from "@/lib/i18n/admin/context";

/** 帮助中心侧边目录：概览 + 12 章。选中态按当前路径解析。 */
export function HelpNav() {
  const t = useAdminT().shell.help;
  const chapters = getHelpChapters(useAdminLocale());
  const pathname = usePathname();
  const router = useRouter();
  const activeKey =
    pathname === Routes.Help
      ? "overview"
      : chapters.find((c) => pathname === `${Routes.Help}/${c.slug}`)?.slug ?? "overview";

  return (
    <Menu
      mode="inline"
      selectedKeys={[activeKey]}
      style={{ borderInlineEnd: 0, background: "transparent" }}
      onClick={({ key }) =>
        router.push(key === "overview" ? Routes.Help : `${Routes.Help}/${key}`)
      }
      items={[
        { key: "overview", label: t.overview },
        ...chapters.map((c) => ({ key: c.slug, label: c.title })),
      ]}
    />
  );
}
