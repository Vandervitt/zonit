import { describe, it, expect } from "vitest";
import { escapeHtml } from "./email";

// 回归：公开留资字段（匿名可控）插入通知邮件 HTML 前必须转义，防 HTML/钓鱼注入。
describe("escapeHtml", () => {
  it("转义尖括号，防标签注入", () => {
    expect(escapeHtml('<a href="x">click</a>')).toBe("&lt;a href=&quot;x&quot;&gt;click&lt;/a&gt;");
  });
  it("转义 & 与单引号", () => {
    expect(escapeHtml("Tom & Jerry's")).toBe("Tom &amp; Jerry&#39;s");
  });
  it("普通文本原样返回", () => {
    expect(escapeHtml("Sara Lee")).toBe("Sara Lee");
  });
});
