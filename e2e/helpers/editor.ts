// e2e/helpers/editor.ts
// 编辑器相关的公共前置动作。
//
// 抽出来的理由是实打实的历史教训：建页入口从独立的 /admin/editor 画廊页改成了
// 落地页列表「新建」弹窗，而四个 spec 各自复制了一份旧流程，于是同一处改动
// 让它们同时长期红着。入口只应有一份描述。

import { expect, type Page } from "@playwright/test";
import { t } from "./i18n";

/** Dev Login（仅 development 生效）建立会话并落到后台。 */
export async function devLogin(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByRole("button", { name: /Dev Login/i }).click();
  await page.waitForURL("**/admin", { timeout: 30_000 });
}

/**
 * 打开「新建」模板弹窗。
 * 按钮在 hydration 完成前就已可点击，过早的点击会静默丢失（弹窗不弹），
 * 故重试「点击 + 断言弹窗已开」，而不是靠固定等待赌 hydration 时机。
 */
export async function openTemplateDialog(page: Page) {
  await page.goto("/admin/landing-pages");
  const dialog = page.getByRole("dialog");
  await expect(async () => {
    await page.getByRole("button", { name: t.pages.create }).click();
    await expect(dialog).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  return dialog;
}

/**
 * 从模板建一页并进入编辑器（「空白开始」入口已随画廊页一并移除）。
 * 建完停在 /admin/editor/[id]，默认选中的是**联系方式**面板 —— 需要别的面板
 * 请自行点开（见 selectPanel）。
 */
export async function createPageFromTemplate(page: Page, templateName = "Aurae Skincare"): Promise<void> {
  const dialog = await openTemplateDialog(page);
  await dialog.getByRole("searchbox", { name: t.editor.templatePicker.searchAria }).fill(templateName);
  await dialog.getByRole("button", { name: t.editor.templatePicker.edit }).first().click();
  await page.waitForURL(/\/admin\/editor\/[^/]+$/, { timeout: 30_000 });
}

/** 点左栏面板入口（名称按子串匹配；文案取自 t.editor.blockList / t.editor.panels.detail）。 */
export async function selectPanel(page: Page, name: RegExp): Promise<void> {
  await page.getByRole("button", { name }).click();
}
