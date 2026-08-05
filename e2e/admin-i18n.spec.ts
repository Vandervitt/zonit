// e2e/admin-i18n.spec.ts
// 后台双语冒烟。
//
// 其余 spec 一律钉中文跑（见 e2e/helpers/db.ts 的 E2E_LOCALE），英文面的覆盖全在这里。
// 不做「整套跑两遍语言」：那会让 CI 时间翻倍，而收益递减——真正会坏的是
// 语言切换本身与「某处漏接字典」，这两件事用一条用例就能守住。
//
// ⚠️ 这里的断言刻意写死字面量，不从字典取。断言引字典就成了永真断言：
// 字典写错、甚至两种语言指向同一份文案，用例照样绿。
import type { Page } from "@playwright/test";
import { test, expect } from "./helpers/app-pool";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";
import { devLogin } from "./helpers/editor";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const RUN = process.env.RUN_DB_E2E === "1";
const DEV_EMAIL = process.env.DEV_USER_EMAIL ?? "dev@localhost";

function makePool(): Pool {
  const connectionString = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL!;
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  return new Pool({ connectionString, ssl: isLocal ? false : { rejectUnauthorized: false } });
}

/** 直接改库切语言：切换器本身另有一条用例覆盖，这里只想快速把界面置于某语言。 */
async function setLocale(locale: "en" | "zh") {
  const pool = makePool();
  try {
    await pool.query(`UPDATE users SET locale = $1 WHERE email = $2`, [locale, DEV_EMAIL]);
  } finally {
    await pool.end();
  }
}

/** 读回当前落库的语言，用于确认切换器真的写进了 users.locale。 */
async function readLocale(): Promise<string | null> {
  const pool = makePool();
  try {
    const r = await pool.query(`SELECT locale FROM users WHERE email = $1`, [DEV_EMAIL]);
    return r.rows[0]?.locale ?? null;
  } finally {
    await pool.end();
  }
}

/**
 * 点语言选项并等它真的落库。
 *
 * 两个坑都靠重试兜住，与 openTemplateDialog 的做法一致：
 * ① 按钮在 hydration 完成前就可点，过早的点击会被静默丢弃（点了但 locale 没变）；
 * ② 保存成功后组件走 window.location.reload()，导航期间旧 DOM 仍在。
 *
 * antd Radio.Button 把 <input> 藏在样式层下（opacity:0、宽 0），可点区域是外层
 * label.ant-radio-button-wrapper——用 role=radio 或内层文本都点不动它。
 */
async function switchTo(page: Page, optionText: string, expected: "en" | "zh") {
  await expect(async () => {
    await page.locator(`label.ant-radio-button-wrapper:has-text("${optionText}")`).click();
    expect(await readLocale()).toBe(expected);
  }).toPass({ timeout: 30_000, intervals: [500, 1_000, 2_000] });
  // 保存后整页 reload，等它落定再让调用方断言文案。
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
}

test.describe("后台双语", () => {
  test.skip(!RUN, "需 RUN_DB_E2E=1（要改 users.locale）");

  // 每条用例结束都复位中文：其余 spec 全部假定中文，留下 en 会让它们连锁变红。
  test.afterEach(async () => {
    await setLocale("zh");
  });

  test("英文账号：工作台导航、页面标题与计费页均为英文", async ({ page }) => {
    await setLocale("en");
    await devLogin(page);

    // 侧边导航
    await expect(page.getByRole("link", { name: "Landing pages" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Leads" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Plan & billing" })).toBeVisible();

    // 列表页标题与主按钮
    await page.goto("/admin/landing-pages");
    await expect(page.getByRole("heading", { name: "Landing pages" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "New" })).toBeVisible();

    // 计费页：额度量词走 formatPlanLimit（英文区分单复数），且英文面不出人民币换算
    await page.goto("/admin/billing");
    await expect(page.getByText("Landing page limit")).toBeVisible({ timeout: 15_000 });
    const body = await page.locator("body").innerText();
    // 单复数都接受：dev 账号的套餐会被其它用例改动，不该让本用例依赖它
    expect(body).toMatch(/\d+ pages?\b/);
    expect(body).not.toContain("约 ¥");
  });

  test("中文账号：同样几处均为中文", async ({ page }) => {
    await setLocale("zh");
    await devLogin(page);

    await expect(page.getByRole("link", { name: "落地页" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "账户与计费" })).toBeVisible();

    await page.goto("/admin/billing");
    await expect(page.getByText("落地页上限")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "账户与计费" })).toBeVisible();
  });


  test("编辑器也跟随语言（它不在 workspace 布局下，Provider 是单独一层）", async ({ page }) => {
    await setLocale("en");
    await devLogin(page);
    await page.goto("/admin/landing-pages");

    // 从模板建一页进编辑器：英文面下入口文案也应是英文
    const dialog = page.getByRole("dialog");
    await expect(async () => {
      await page.getByRole("button", { name: "New" }).click();
      await expect(dialog).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    await dialog.getByRole("searchbox", { name: "Search template names" }).fill("Aurae Skincare");
    await dialog.getByRole("button", { name: "Edit directly" }).first().click();
    await page.waitForURL(/\/admin\/editor\/[^/]+$/, { timeout: 30_000 });

    await expect(page.getByText("Page structure")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
    // 区块名来自 issues.sections，曾经写死在 schema 里
    await expect(page.getByText("FAQ")).toBeVisible();
  });

  test("帮助中心 12 章跟随语言，slug 不变", async ({ page }) => {
    await setLocale("en");
    await devLogin(page);
    await page.goto("/admin/help/domains-publishing");

    await expect(page.getByRole("heading", { name: "Domains & publishing" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("menuitem", { name: "Getting started" })).toBeVisible();

    // 同一 slug 换语言仍应命中同一章（slug 跨语言一致），不该 404
    await setLocale("zh");
    await page.reload();
    await expect(page.getByRole("heading", { name: "域名与发布" })).toBeVisible({ timeout: 15_000 });
  });
});

// ⚠️ 本条不与 afterEach 抢同一行：它自己就在改 users.locale，
// 而 afterEach 的复位可能与切换器的写入撞在一起（曾表现为三次里挂两次）。
// serial 保证它独占执行，用例自己负责收尾。
test.describe.serial("语言切换器", () => {
  test.skip(!RUN, "需 RUN_DB_E2E=1（要改 users.locale）");

  test("设置页切换语言：整页即时改变，且刷新后保持", async ({ page }) => {
    await setLocale("zh");
    await devLogin(page);
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { name: "设置" })).toBeVisible({ timeout: 15_000 });

    // 选项名恒为该语言的自称，不随当前界面翻译。
    // antd Radio.Button 把 <input> 藏在样式层下（opacity:0、宽 0），可点区域是外层
    // label.ant-radio-button-wrapper。用 role=radio 或内层文本都点不动它。
    await switchTo(page, "English", "en");

    // 落库了才算数：只改内存状态的话，换设备/换标签页就丢了。
    expect(await readLocale()).toBe("en");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 20_000 });

    // 刷新后仍是英文
    await page.reload();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 20_000 });

    // 切回中文，自己收尾（本 describe 不吃外层 afterEach 的复位）
    await switchTo(page, "简体中文", "zh");
    expect(await readLocale()).toBe("zh");
    await expect(page.getByRole("link", { name: "落地页" })).toBeVisible({ timeout: 20_000 });
  });
});
