import { describe, expect, it } from "vitest";
import {
  RESERVED_SUBDOMAINS,
  buildPlatformSubdomain,
  isPlatformSubdomainHost,
  isReservedSubdomain,
  slugifyForSubdomain,
} from "./subdomain";

const ROOT = "zapbridge.site";

describe("slugifyForSubdomain", () => {
  it("常规标题转成小写连字符 slug", () => {
    expect(slugifyForSubdomain("Lumora Dental Studio")).toBe("lumora-dental-studio");
  });

  it("去掉标点与多余空白，不产生连续连字符", () => {
    expect(slugifyForSubdomain("  Acme & Co. —  Dental!  ")).toBe("acme-co-dental");
  });

  it("裁掉首尾连字符 —— DNS label 不允许以连字符开头或结尾", () => {
    expect(slugifyForSubdomain("--hello--")).toBe("hello");
    expect(slugifyForSubdomain("!!!Clinic!!!")).toBe("clinic");
  });

  it("截断到 DNS label 上限且不留下尾部连字符", () => {
    const slug = slugifyForSubdomain("a".repeat(80));
    expect(slug).not.toBeNull();
    expect(slug!.length).toBeLessThanOrEqual(63);

    // 截断点恰好落在连字符上时必须再裁一次
    const cut = slugifyForSubdomain(`${"b".repeat(62)} tail`);
    expect(cut!.endsWith("-")).toBe(false);
  });

  it("纯非 ASCII 标题无法转出 slug 时返回 null（由调用方回退到随机名）", () => {
    // 模板文案是英文，但用户可以把页面标题改成中文
    expect(slugifyForSubdomain("牙科诊所")).toBeNull();
    expect(slugifyForSubdomain("   ")).toBeNull();
    expect(slugifyForSubdomain("!!!")).toBeNull();
  });

  it("保留数字，且不以数字以外的字符结尾", () => {
    expect(slugifyForSubdomain("Clinic 2026")).toBe("clinic-2026");
  });
});

describe("isReservedSubdomain", () => {
  it("拦截平台自用与基础设施名", () => {
    for (const s of ["www", "api", "admin", "app", "mail", "ns1", "cdn", "status"]) {
      expect(isReservedSubdomain(s), `${s} 应被保留`).toBe(true);
    }
  });

  it("大小写不敏感", () => {
    expect(isReservedSubdomain("WWW")).toBe(true);
    expect(isReservedSubdomain("Admin")).toBe(true);
  });

  it("放行正常业务名", () => {
    for (const s of ["lumora-dental", "acme", "clinic-2026"]) {
      expect(isReservedSubdomain(s), `${s} 不该被保留`).toBe(false);
    }
  });

  it("保留字表本身不含空值且全为小写", () => {
    expect(RESERVED_SUBDOMAINS.length).toBeGreaterThan(0);
    for (const s of RESERVED_SUBDOMAINS) {
      expect(s).toBe(s.toLowerCase());
      expect(s.trim()).toBe(s);
      expect(s).not.toBe("");
    }
  });
});

describe("isPlatformSubdomainHost", () => {
  it("识别平台子域", () => {
    expect(isPlatformSubdomainHost("acme.zapbridge.site", ROOT)).toBe(true);
    expect(isPlatformSubdomainHost("ACME.ZAPBRIDGE.SITE", ROOT)).toBe(true);
  });

  it("apex 本身不算子域 —— 它是平台演示位，不该被当成某个用户的地址", () => {
    expect(isPlatformSubdomainHost("zapbridge.site", ROOT)).toBe(false);
  });

  it("拒绝仿冒后缀", () => {
    // 这条是安全断言：后缀匹配写成 endsWith(root) 会把这些放进来
    expect(isPlatformSubdomainHost("evilzapbridge.site", ROOT)).toBe(false);
    expect(isPlatformSubdomainHost("zapbridge.site.evil.com", ROOT)).toBe(false);
    expect(isPlatformSubdomainHost("notzapbridge.site", ROOT)).toBe(false);
  });

  it("客户自有域名与平台主域一律不是平台子域", () => {
    expect(isPlatformSubdomainHost("brand.com", ROOT)).toBe(false);
    expect(isPlatformSubdomainHost("zapbridge.tech", ROOT)).toBe(false);
  });

  it("未配置 root 时一律返回 false（避免空串把所有 host 判成子域）", () => {
    expect(isPlatformSubdomainHost("acme.zapbridge.site", "")).toBe(false);
    expect(isPlatformSubdomainHost("anything.com", "")).toBe(false);
  });
});

describe("buildPlatformSubdomain", () => {
  it("拼接 slug 与 root", () => {
    expect(buildPlatformSubdomain("acme", ROOT)).toBe("acme.zapbridge.site");
  });

  it("root 未配置时返回 null", () => {
    expect(buildPlatformSubdomain("acme", "")).toBeNull();
  });

  it("拼出来的结果必须能被 isPlatformSubdomainHost 认回来", () => {
    const host = buildPlatformSubdomain("lumora-dental", ROOT);
    expect(host).not.toBeNull();
    expect(isPlatformSubdomainHost(host!, ROOT)).toBe(true);
  });
});
