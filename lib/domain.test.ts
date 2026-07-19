import { describe, it, expect } from "vitest";
import { isMainlandChinaDomain, normalizeDomain } from "./domain";

describe("normalizeDomain", () => {
  it("accepts a bare hostname", () => {
    expect(normalizeDomain("zapbridge.tech")).toBe("zapbridge.tech");
  });

  it("strips the scheme from a pasted URL", () => {
    expect(normalizeDomain("https://zapbridge.tech")).toBe("zapbridge.tech");
    expect(normalizeDomain("http://zapbridge.tech")).toBe("zapbridge.tech");
  });

  it("strips path, query, trailing slash and port", () => {
    expect(normalizeDomain("https://zapbridge.tech/admin/domains")).toBe("zapbridge.tech");
    expect(normalizeDomain("zapbridge.tech/?ref=1")).toBe("zapbridge.tech");
    expect(normalizeDomain("zapbridge.tech:443")).toBe("zapbridge.tech");
  });

  it("trims whitespace, lowercases and drops a trailing dot", () => {
    expect(normalizeDomain("  WWW.Example.COM.  ")).toBe("www.example.com");
  });

  it("preserves subdomains", () => {
    expect(normalizeDomain("https://www.example.com")).toBe("www.example.com");
  });

  it("returns null for invalid input", () => {
    expect(normalizeDomain("")).toBeNull();
    expect(normalizeDomain("not a domain")).toBeNull();
    expect(normalizeDomain("https://")).toBeNull();
    expect(normalizeDomain("localhost")).toBeNull();
  });
});

describe("isMainlandChinaDomain", () => {
  it("blocks .cn and its second-level registry zones", () => {
    expect(isMainlandChinaDomain("example.cn")).toBe(true);
    expect(isMainlandChinaDomain("shop.example.com.cn")).toBe(true);
    expect(isMainlandChinaDomain("example.net.cn")).toBe(true);
    expect(isMainlandChinaDomain("example.org.cn")).toBe(true);
    expect(isMainlandChinaDomain("example.gov.cn")).toBe(true);
  });

  it("blocks mainland-administered IDN TLDs in punycode form", () => {
    expect(isMainlandChinaDomain("xn--fiq228c.xn--fiqs8s")).toBe(true); // 例子.中国
    expect(isMainlandChinaDomain("xn--fiq228c.xn--fiqz9s")).toBe(true); // 例子.中國
    expect(isMainlandChinaDomain("example.xn--55qx5d")).toBe(true); // .公司
    expect(isMainlandChinaDomain("example.xn--io0a7i")).toBe(true); // .网络
  });

  it("allows international TLDs", () => {
    expect(isMainlandChinaDomain("zapbridge.tech")).toBe(false);
    expect(isMainlandChinaDomain("example.com")).toBe(false);
    expect(isMainlandChinaDomain("example.co")).toBe(false);
  });

  it("does not confuse a cn label elsewhere in the hostname", () => {
    expect(isMainlandChinaDomain("cn.example.com")).toBe(false);
    expect(isMainlandChinaDomain("example.cnn")).toBe(false);
  });
});
