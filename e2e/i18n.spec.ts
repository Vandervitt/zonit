// e2e/i18n.spec.ts
// 营销站双语：/ 出英文、/zh 出中文，切换器往返保持路径，hreflang 齐备，后台不受影响。
// 不依赖数据库 fixture，故无需 RUN_DB_E2E。
import { test, expect } from "@playwright/test";

test.describe("营销站双语", () => {
  test("/ 渲染英文首页", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Ad-ready landing pages");
    await expect(page.getByRole("link", { name: "Start free" }).first()).toBeVisible();
  });

  test("/zh 渲染中文首页", async ({ page }) => {
    await page.goto("/zh");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("投放级落地页");
    await expect(page.getByRole("link", { name: "免费开始" }).first()).toBeVisible();
  });

  test("切换器往返保持在首页", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "中文" }).first().click();
    await expect(page).toHaveURL(/\/zh$/);
    await page.getByRole("link", { name: "English" }).first().click();
    await expect(page).toHaveURL(/localhost:3001\/$/);
  });

  test("两种语言的 head 都含完整 hreflang", async ({ page }) => {
    for (const path of ["/", "/zh"]) {
      await page.goto(path);
      const langs = await page
        .locator('link[rel="alternate"][hreflang]')
        .evaluateAll((els) => els.map((e) => e.getAttribute("hreflang")));
      expect(langs).toContain("en");
      expect(langs).toContain("zh-Hans");
      expect(langs).toContain("x-default");
    }
  });

  test("中文页 canonical 指向 /zh", async ({ page }) => {
    await page.goto("/zh");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toMatch(/\/zh$/);
  });

  test("/zh 下的套餐对比表也是中文", async ({ page }) => {
    await page.goto("/zh");
    await expect(page.getByText("最受欢迎").first()).toBeVisible();
  });

  test("/ 下的套餐对比表是英文", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Most popular").first()).toBeVisible();
  });

  // 收款货币是美元：两语都必须出美元价，只有中文面额外附「约 ¥xx」参考换算。
  test("英文面只出美元价，不出人民币换算", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText("$19.99").first()).toBeVisible();
    await expect(page.getByText(/约 ¥/)).toHaveCount(0);
  });

  test("中文面出美元价并附人民币参考换算", async ({ page }) => {
    await page.goto("/zh/pricing");
    await expect(page.getByText("$19.99").first()).toBeVisible();
    // 汇率取自实时接口，只断言形态与「约」字，不锁死具体数值。
    await expect(page.getByText(/^约 ¥[\d,]+\.\d{2}$/).first()).toBeVisible();
  });

  test("/zh 子树标注中文语言属性", async ({ page }) => {
    await page.goto("/zh");
    await expect(page.locator('div[lang="zh-Hans"]').first()).toBeAttached();
  });

  test("/pricing 与 /zh/pricing 各出对应语言", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pick the plan that fits");
    await page.goto("/zh/pricing");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("选择适合你的套餐");
  });

  test("/anti-ban 与 /zh/anti-ban 各出对应语言", async ({ page }) => {
    await page.goto("/anti-ban");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("One template, ten advertisers");
    await page.goto("/zh/anti-ban");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("同一套模板，十个广告主");
  });

  test("/login 与 /zh/login 各出对应语言", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome back");
    await expect(page.getByPlaceholder("Your email")).toBeVisible();
    await page.goto("/zh/login");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("欢迎回来");
    await expect(page.getByPlaceholder("你的邮箱")).toBeVisible();
  });

  test("/register 与 /zh/register 各出对应语言", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Create your account");
    await page.goto("/zh/register");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("创建账号");
  });

  test("模板画廊：行业分组标题与卡片各出对应语言", async ({ page }) => {
    await page.goto("/templates");
    await expect(page.getByRole("heading", { name: "Beauty & personal care" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Toys & baby" })).toBeVisible();
    await page.goto("/zh/templates");
    await expect(page.getByRole("heading", { name: "美妆个护" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "玩具母婴" })).toBeVisible();
  });

  test("模板画廊首屏图片使用高优先级与响应式来源", async ({ page }) => {
    await page.goto("/templates");
    const images = page.locator("main section").first().locator("img");

    expect(await images.count()).toBeGreaterThan(3);
    await expect(images.nth(0)).toHaveAttribute("loading", "eager");
    await expect(images.nth(0)).toHaveAttribute("fetchpriority", "high");
    await expect(images.nth(0)).toHaveAttribute("srcset", /400w.*800w.*1200w/);
    await expect(images.nth(1)).toHaveAttribute("loading", "eager");
    await expect(images.nth(2)).toHaveAttribute("loading", "eager");
    await expect(images.nth(3)).toHaveAttribute("loading", "lazy");

    // 画廊按行业分为多个 section，抢占式加载只应发生在首屏首组，
    // 否则折叠下方的图片会一并抢占带宽，反而拖慢 LCP。
    await expect(page.locator("main img[loading='eager']")).toHaveCount(3);
    await expect(page.locator("main img[fetchpriority='high']")).toHaveCount(1);
    await expect(page.locator("main section").nth(1).locator("img").first()).toHaveAttribute(
      "loading",
      "lazy",
    );
  });

  test("模板详情页：seoIntro 与派生 FAQ 各出对应语言", async ({ page }) => {
    await page.goto("/templates/vitamins");
    await expect(page.getByText(/Vitae Nutrition is a discovery-capture template/)).toBeVisible();
    await expect(page.getByText(/Can I change anything in the Vitae Nutrition template/)).toBeVisible();
    await page.goto("/zh/templates/vitamins");
    await expect(page.getByText(/Vitae Nutrition 是面向膳食补充剂出海/)).toBeVisible();
    await expect(page.getByText(/Vitae Nutrition 模板可以随意修改吗/)).toBeVisible();
  });

  test("模板详情页面包屑随语言变化", async ({ page }) => {
    await page.goto("/templates/vitamins");
    await expect(page.getByRole("link", { name: "Templates" }).first()).toBeVisible();
    await page.goto("/zh/templates/vitamins");
    await expect(page.getByRole("link", { name: "模板库" }).first()).toBeVisible();
  });

  test("指南列表与详情各出对应语言", async ({ page }) => {
    await page.goto("/guides");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Overseas lead-gen landing page guides",
    );
    await page.goto("/guides/whatsapp-lead-landing-page");
    await expect(page.getByRole("heading", { name: "The five most common mistakes" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "References" })).toBeVisible();

    await page.goto("/zh/guides");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("海外获客落地页指南");
    await page.goto("/zh/guides/whatsapp-lead-landing-page");
    await expect(page.getByRole("heading", { name: "最常见的 5 个错误" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "参考资料" })).toBeVisible();
  });

  test("llms.txt 为英文并同时列出双语 URL", async ({ request }) => {
    const res = await request.get("/llms.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("Core capabilities");
    expect(body).toContain("/zh/pricing");
    expect(body).toContain("/zh/templates");
  });

  test("法务页双语，且两版都声明以英文版为准", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Privacy Policy");
    await expect(page.getByText(/the English version prevails/)).toBeVisible();

    await page.goto("/zh/terms");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("服务条款");
    await expect(page.getByText(/以英文版为准/)).toBeVisible();
  });

  test("各页的切换器往返都保持在同一页", async ({ page }) => {
    // 切换器的 aria-label 用「当前页语言」表述：英文页是 "Switch language: 中文"，
    // 中文页是 "切换语言: English"。
    // /pricing 不在此列——该页本来就没有站点导航（裸 main + 对比表），故无切换器落点。
    for (const route of ["/anti-ban", "/login", "/register", "/templates", "/guides"]) {
      // /privacy 与 /terms 同 /pricing：法务页无站点导航，故无切换器落点。
      await page.goto(route);
      await page.getByRole("link", { name: /Switch language/ }).first().click();
      await expect(page).toHaveURL(new RegExp(`/zh${route}$`));
      await page.getByRole("link", { name: /切换语言/ }).first().click();
      await expect(page).toHaveURL(new RegExp(`localhost:3001${route}$`));
    }
  });

  test("已国际化的页面都显示切换器", async ({ page }) => {
    // 反向保护见 lib/i18n/routes.test.ts：未登记路由 localePath 原样返回，
    // LocaleSwitcher 据此隐藏，避免链到不存在的 /zh 地址。
    for (const route of ["/", "/anti-ban", "/templates", "/guides", "/login"]) {
      await page.goto(route);
      expect(
        await page.getByRole("link", { name: /Switch language/ }).count(),
        route,
      ).toBeGreaterThan(0);
    }
  });

  test("未国际化的后台入口不受影响：/zh/admin 返回 404", async ({ page }) => {
    const res = await page.goto("/zh/admin");
    expect(res?.status()).toBe(404);
  });
});

// 首页 IP 分流：Vercel 在边缘注入 x-vercel-ip-country，本地用 extraHTTPHeaders 模拟。
test.describe("首页按 IP 分流语言", () => {
  test("大陆 IP 访问 / → 落到中文首页", async ({ browser }) => {
    const ctx = await browser.newContext({ extraHTTPHeaders: { "x-vercel-ip-country": "CN" } });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/\/zh$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("投放级落地页");
    await ctx.close();
  });

  test("非大陆 IP 访问 / → 留在英文首页", async ({ browser }) => {
    const ctx = await browser.newContext({ extraHTTPHeaders: { "x-vercel-ip-country": "US" } });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/localhost:3001\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Ad-ready landing pages");
    await ctx.close();
  });

  test("大陆 IP 手动切回 English 后刷新不再被弹回中文", async ({ browser }) => {
    const ctx = await browser.newContext({ extraHTTPHeaders: { "x-vercel-ip-country": "CN" } });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/\/zh$/);

    await page.getByRole("link", { name: /Switch language|切换语言/ }).first().click();
    await expect(page).toHaveURL(/localhost:3001\/$/);

    await page.reload();
    await expect(page).toHaveURL(/localhost:3001\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Ad-ready landing pages");
    await ctx.close();
  });

  test("分流只作用于首页：大陆 IP 的 /pricing 仍是英文", async ({ browser }) => {
    const ctx = await browser.newContext({ extraHTTPHeaders: { "x-vercel-ip-country": "CN" } });
    const page = await ctx.newPage();
    await page.goto("/pricing");
    await expect(page).toHaveURL(/\/pricing$/);
    await ctx.close();
  });

  test("爬虫 UA 不参与分流：大陆 IP 的 Googlebot 仍拿英文首页", async ({ browser }) => {
    const ctx = await browser.newContext({
      extraHTTPHeaders: { "x-vercel-ip-country": "CN" },
      userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/localhost:3001\/$/);
    await ctx.close();
  });
});
