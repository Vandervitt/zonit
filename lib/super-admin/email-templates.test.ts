import { describe, it, expect } from "vitest";
import { ADMIN_EMAIL_TEMPLATES, fillAdminEmailTemplate } from "./email-templates";

describe("fillAdminEmailTemplate", () => {
  it("有名字用名字打招呼，名字两端空白去掉", () => {
    const t = fillAdminEmailTemplate("stuck_check_in", { name: "  Vincent " });
    expect(t.body.startsWith("Hi Vincent,")).toBe(true);
  });

  it("无名字或名字像公司/邮箱前缀时用 Hi there", () => {
    expect(fillAdminEmailTemplate("stuck_check_in", { name: null }).body.startsWith("Hi there,")).toBe(true);
    expect(fillAdminEmailTemplate("stuck_check_in", { name: "IRSA SYSTEMS" }).body.startsWith("Hi there,")).toBe(true);
  });

  it("模板正文不含任何链接（冷启动期送达率优先）", () => {
    const ids = (Object.keys(ADMIN_EMAIL_TEMPLATES) as (keyof typeof ADMIN_EMAIL_TEMPLATES)[]).filter((i) => i !== "blank");
    for (const id of ids) {
      const t = fillAdminEmailTemplate(id, { name: "A" });
      expect(t.body).not.toMatch(/https?:\/\//);
      expect(t.subject.length).toBeGreaterThan(0);
    }
  });

  it("空白模板留给自由书写", () => {
    expect(fillAdminEmailTemplate("blank", { name: "A" })).toEqual({ subject: "", body: "Hi A,\n\n\n\nThanks,\nWitt\nFounder, Urgizat" });
  });
});
