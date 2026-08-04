import { describe, it, expect } from "vitest";
import { resolveLiveUrl } from "./live-url";

const page = (over: Partial<Parameters<typeof resolveLiveUrl>[0]> = {}) => ({
  status: "published", bound_domain: "clinic.example", bound_path: "/", ...over,
});

describe("resolveLiveUrl", () => {
  it("根路径不拼多余的斜杠", () => {
    expect(resolveLiveUrl(page())).toEqual({ ok: true, url: "https://clinic.example" });
  });

  it("多路径发布时带上路径——同域名下可能挂着好几张页", () => {
    expect(resolveLiveUrl(page({ bound_path: "/implants" })))
      .toEqual({ ok: true, url: "https://clinic.example/implants" });
  });

  it("草稿没有线上地址", () => {
    expect(resolveLiveUrl(page({ status: "draft" }))).toEqual({ ok: false, reason: "not_published" });
  });

  it("已发布但没绑定生效域名 → no_domain（自检无从下手）", () => {
    expect(resolveLiveUrl(page({ bound_domain: null }))).toEqual({ ok: false, reason: "no_domain" });
  });
});
