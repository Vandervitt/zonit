// 列表接口失败错误态：SWR error 曾被 `data ?? []` 吞掉，渲染成「还没有数据」空态误导用户。
// LoadErrorAlert 保证 error 存在时可见报错并提供手动重试（全局 shouldRetryOnError: false，无自动重试）。
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LoadErrorAlert } from "./LoadErrorAlert";
import { ApiError } from "@/lib/api/fetcher";

const html = (error: unknown, label?: string) =>
  renderToStaticMarkup(createElement(LoadErrorAlert, { error, onRetry: () => {}, label }));

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
});
