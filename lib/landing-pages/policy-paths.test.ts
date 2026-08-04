import { describe, it, expect } from "vitest";
import { policyPath, splitPolicyPath } from "./policy-paths";

describe("政策子页地址", () => {
  it("根路径页 → /privacy、/terms", () => {
    expect(policyPath("/", "privacy")).toBe("/privacy");
    expect(policyPath("/", "terms")).toBe("/terms");
  });

  it("子路径页 → 挂在自己路径下（多路径发布互不串页）", () => {
    expect(policyPath("/invisalign", "privacy")).toBe("/invisalign/privacy");
    expect(policyPath("/services/whitening", "terms")).toBe("/services/whitening/terms");
  });

  it("预览前缀同样适用", () => {
    expect(policyPath("/preview/abc", "privacy")).toBe("/preview/abc/privacy");
  });

  it("尾斜杠不产生双斜杠", () => {
    expect(policyPath("/invisalign/", "privacy")).toBe("/invisalign/privacy");
  });

  it("反解回落地页所在路径", () => {
    expect(splitPolicyPath("/privacy")).toEqual({ parentPath: "/", kind: "privacy" });
    expect(splitPolicyPath("/invisalign/terms")).toEqual({ parentPath: "/invisalign", kind: "terms" });
  });

  it("非政策路径不误判", () => {
    expect(splitPolicyPath("/")).toBeNull();
    expect(splitPolicyPath("/invisalign")).toBeNull();
    expect(splitPolicyPath("/privacy-policy")).toBeNull();
  });

  it("生成与反解互逆", () => {
    for (const base of ["/", "/invisalign", "/services/whitening"]) {
      for (const kind of ["privacy", "terms"] as const) {
        expect(splitPolicyPath(policyPath(base, kind))).toEqual({ parentPath: base, kind });
      }
    }
  });
});
