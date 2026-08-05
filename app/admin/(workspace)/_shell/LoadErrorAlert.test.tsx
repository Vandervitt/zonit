// 列表接口失败错误态：SWR error 曾被 `data ?? []` 吞掉，渲染成「还没有数据」空态误导用户。
// LoadErrorAlert 保证 error 存在时可见报错并提供手动重试（全局 shouldRetryOnError: false，无自动重试）。
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LoadErrorAlert } from "./LoadErrorAlert";
import { AdminLocaleProvider } from "@/lib/i18n/admin/context";
import type { Locale } from "@/lib/i18n/config";
import { ApiError } from "@/lib/api/fetcher";

// 组件从 Context 取字典，故渲染必须带 Provider——这也顺带锁住「漏包 Provider 会抛错」
// 的行为（见 context.tsx：静默回退默认语言会让漏包变成难以定位的偶发英文页）。
const html = (error: unknown, label?: string, locale: Locale = "zh") =>
  renderToStaticMarkup(
    <AdminLocaleProvider locale={locale}>
      <LoadErrorAlert error={error} onRetry={() => {}} label={label} />
    </AdminLocaleProvider>,
  );

describe("LoadErrorAlert", () => {
  it("无错误 → 不渲染", () => {
    expect(html(undefined)).toBe("");
  });

  it("有错误 → 显示加载失败与重试按钮", () => {
    const out = html(new Error("boom"), "落地页列表");
    expect(out).toContain("落地页列表加载失败");
    expect(out).toMatch(/重\s*试/); // antd 两字按钮自动插空格
  });

  it("ApiError → 附带 HTTP 状态码", () => {
    const out = html(new ApiError(500, "server error"), "线索");
    expect(out).toContain("线索加载失败");
    expect(out).toContain("HTTP 500");
  });

  it("英文界面下出英文错误态", () => {
    const out = html(new ApiError(500, "server error"), "the lead list", "en");
    expect(out).toContain("Could not load the lead list");
    expect(out).toContain("HTTP 500");
    expect(out).toContain("Retry");
  });

  it("未传 label 时用字典兜底词，不出现空串拼接", () => {
    expect(html(new Error("boom"))).toContain("数据加载失败");
    expect(html(new Error("boom"), undefined, "en")).toContain("Could not load the data");
  });
});
