// e2e/editor-next-preview.spec.ts
import { test, expect } from "@playwright/test";

test.describe("editor-next 实时预览", () => {
  test("编辑 Hero 标题即时反映到预览 iframe", async ({ page }) => {
    const res = await page.goto("/editor-next");
    expect(res?.status()).toBe(200);

    // 右栏预览 iframe 存在，预览初始呈现样例 Hero 标题
    const frame = page.frameLocator('iframe[title="落地页实时预览"]');
    await expect(frame.getByRole("heading", { name: /Skincare that actually fits/i })).toBeVisible();

    // 中栏 Hero 主标题输入框：填入新标题
    const titleInput = page.getByLabel("主标题");
    await titleInput.fill("Brand new hero headline");

    // 预览 iframe 实时更新为新标题，旧标题消失
    await expect(frame.getByRole("heading", { name: "Brand new hero headline" })).toBeVisible();
    await expect(frame.getByRole("heading", { name: /Skincare that actually fits/i })).toHaveCount(0);
  });
});
