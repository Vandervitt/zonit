import { describe, it, expect } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { locales, defaultLocale, htmlLang, ogLocale } from "./config";
import { LOCALIZED_ROUTES, localePath, stripLocale, isLocalizedRoute } from "./routes";
import { PENDING_ROUTES } from "@/lib/seo/sitemap-entries";

describe("i18n config", () => {
  it("英文是默认 locale，且只支持 en/zh", () => {
    expect(defaultLocale).toBe("en");
    expect([...locales]).toEqual(["en", "zh"]);
  });

  it("每个 locale 都有 html lang 与 og locale 映射", () => {
    expect(htmlLang.en).toBe("en");
    expect(htmlLang.zh).toBe("zh-Hans");
    expect(ogLocale.en).toBe("en_US");
    expect(ogLocale.zh).toBe("zh_CN");
  });
});

describe("localePath", () => {
  it("英文不加前缀", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/pricing")).toBe("/pricing");
  });

  it("中文加 /zh 前缀，根路径特判为 /zh 而非 /zh/", () => {
    expect(localePath("zh", "/")).toBe("/zh");
  });

  it("非营销路由一律不加前缀——加了会 404", () => {
    expect(localePath("zh", "/admin")).toBe("/admin");
    expect(localePath("zh", "/admin/billing")).toBe("/admin/billing");
    expect(localePath("zh", "/api/leads")).toBe("/api/leads");
    expect(localePath("zh", "/p/some-slug")).toBe("/p/some-slug");
  });

  it("带 hash / query 的营销路径仍能正确加前缀", () => {
    expect(localePath("zh", "/#pricing")).toBe("/zh#pricing");
    expect(localePath("zh", "/?utm_source=x")).toBe("/zh?utm_source=x");
  });
});

describe("stripLocale", () => {
  it("剥掉 /zh 前缀并回报 locale", () => {
    expect(stripLocale("/zh")).toEqual({ locale: "zh", pathname: "/" });
    expect(stripLocale("/zh/pricing")).toEqual({ locale: "zh", pathname: "/pricing" });
  });

  it("无前缀视为英文", () => {
    expect(stripLocale("/")).toEqual({ locale: "en", pathname: "/" });
    expect(stripLocale("/pricing")).toEqual({ locale: "en", pathname: "/pricing" });
  });

  it("不把 /zhen 这类同前缀路径误判成中文", () => {
    expect(stripLocale("/zhen")).toEqual({ locale: "en", pathname: "/zhen" });
  });

  it("localePath 与 stripLocale 互为逆运算", () => {
    for (const route of LOCALIZED_ROUTES) {
      for (const locale of locales) {
        expect(stripLocale(localePath(locale, route))).toEqual({ locale, pathname: route });
      }
    }
  });
});

describe("isLocalizedRoute", () => {
  it("清单内路由为真", () => {
    expect(isLocalizedRoute("/")).toBe(true);
  });

  it("尚未镜像的营销页为假——分期交付期间必须降级到英文侧路径，否则链到 404", () => {
    // /guides 的 /zh 镜像要到 PR 4 才存在，
    // 此时中文页导航里的「指南」必须仍指向 /guides（内容尚为中文，正好合适）。
    expect(isLocalizedRoute("/guides")).toBe(false);
    expect(localePath("zh", "/guides")).toBe("/guides");
  });

  it("已镜像的页面为真（含 /templates 动态子树）", () => {
    for (const route of ["/pricing", "/anti-ban", "/login", "/register", "/templates", "/templates/skincare"]) {
      expect(isLocalizedRoute(route), route).toBe(true);
      expect(localePath("zh", route)).toBe(`/zh${route}`);
    }
  });

  it("后台与接口为假", () => {
    expect(isLocalizedRoute("/admin")).toBe(false);
    expect(isLocalizedRoute("/api/leads")).toBe(false);
  });
});

describe("路由清单与 sitemap 待办清单互斥", () => {
  // 一页上线时要同时做两件事：加进 LOCALIZED_ROUTES、从 PENDING_ROUTES 移除。
  // 只做前者会让 sitemap 同时输出该页的双语条目和单语条目（重复 URL）。
  it("同一路由不得同时出现在 LOCALIZED_ROUTES 与 PENDING_ROUTES", () => {
    const overlap = PENDING_ROUTES.filter((p) =>
      (LOCALIZED_ROUTES as readonly string[]).includes(p),
    );
    expect(overlap, `已国际化但仍留在 sitemap PENDING_ROUTES：${overlap.join(", ")}`).toEqual([]);
  });
});

// 方案 B（app/zh 镜像树）的固有风险是「加了营销页忘补中文镜像」。
// 这个测试是唯一的机械兜底：清单里登记了，磁盘上就必须有对应文件。
describe("app/zh 镜像对等性", () => {
  const appDir = join(process.cwd(), "app");

  /**
   * 在给定子树下查找某路由对应的 page.tsx。
   * 需要识别 Next 的路由组：`app/(auth)/login/page.tsx` 对外就是 `/login`，
   * 括号目录不计入 URL，故不能按字面路径拼接。
   */
  function findPage(root: string, route: string): string | null {
    const segments = route === "/" ? [] : route.slice(1).split("/");

    const walk = (dir: string, remaining: string[]): string | null => {
      if (!existsSync(dir)) return null;
      if (remaining.length === 0) {
        const page = join(dir, "page.tsx");
        return existsSync(page) ? page : null;
      }
      const [head, ...tail] = remaining;
      // 直接命中同名目录
      const direct = walk(join(dir, head), tail);
      if (direct) return direct;
      // 否则穿过路由组目录 `(xxx)` 继续找（路由组不消耗 URL 段）
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory() || !/^\(.+\)$/.test(entry.name)) continue;
        const viaGroup = walk(join(dir, entry.name), remaining);
        if (viaGroup) return viaGroup;
      }
      return null;
    };

    return walk(root, segments);
  }

  it.each(LOCALIZED_ROUTES)("%s 同时存在英文与中文页面文件", (route) => {
    expect(findPage(appDir, route), `缺英文页：${route}`).not.toBeNull();
    expect(findPage(join(appDir, "zh"), route), `缺中文镜像：/zh${route}`).not.toBeNull();
  });

  it("app/zh 子树存在语言布局", () => {
    expect(existsSync(join(appDir, "zh", "layout.tsx"))).toBe(true);
  });

  it("findPage 能穿过路由组——否则 /login 这类页面会被误判为缺失", () => {
    // app/(auth)/login/page.tsx 对外是 /login
    expect(findPage(appDir, "/login")).toContain("(auth)");
  });
});
