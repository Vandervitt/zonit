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

describe("mainlandNsProvider", () => {
  it("识别主流大陆 DNS 服务商 NS（返回服务商域）", async () => {
    const { mainlandNsProvider } = await import("./domain");
    expect(mainlandNsProvider(["dns3.hichina.com", "dns4.hichina.com"])).toBe("hichina.com");
    expect(mainlandNsProvider(["ns1.alidns.com"])).toBe("alidns.com");
    expect(mainlandNsProvider(["f1g1ns1.dnspod.net"])).toBe("dnspod.net");
    expect(mainlandNsProvider(["ns3.dnsv5.com"])).toBe("dnsv5.com");
    expect(mainlandNsProvider(["ns1.dns.com"])).toBe("dns.com");
    expect(mainlandNsProvider(["ns1.myhostadmin.net"])).toBe("myhostadmin.net");
    expect(mainlandNsProvider(["ns1.huaweicloud-dns.com"])).toBe("huaweicloud-dns.com");
  });

  it("海外 DNS 服务商返回 null", async () => {
    const { mainlandNsProvider } = await import("./domain");
    expect(mainlandNsProvider(["dana.ns.cloudflare.com", "kip.ns.cloudflare.com"])).toBeNull();
    expect(mainlandNsProvider(["ns1.vercel-dns.com"])).toBeNull();
    expect(mainlandNsProvider(["dns1.registrar-servers.com"])).toBeNull();
    expect(mainlandNsProvider([])).toBeNull();
  });

  it("不被形似后缀误伤（子串不算，须按域名段边界匹配）", async () => {
    const { mainlandNsProvider } = await import("./domain");
    expect(mainlandNsProvider(["ns1.nothichina.com"])).toBeNull();
    expect(mainlandNsProvider(["ns1.mydns.company"])).toBeNull();
  });

  it("大小写与结尾点归一", async () => {
    const { mainlandNsProvider } = await import("./domain");
    expect(mainlandNsProvider(["DNS3.HiChina.COM."])).toBe("hichina.com");
  });
});
