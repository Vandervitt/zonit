import { describe, expect, it } from "vitest";
import {
  RESERVED_SUBDOMAINS,
  buildPlatformSubdomain,
  isPlatformOwnedHost,
  isPlatformSubdomainHost,
  isReservedSubdomain,
  platformSubdomainRoots,
  slugifyForSubdomain,
  subdomainFallbackId,
  subdomainSuffix,
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

describe("随机串字母表", () => {
  // nanoid 默认字母表含 `_` 与 `-`（实测 4 位结果约 13% 会带上），拼进域名就是
  // 非法 DNS label。这条用足量采样把缺陷钉死，不靠单次随机撞上。
  it("只产出小写字母与数字，绝不出现 _ 或首尾连字符", () => {
    for (let i = 0; i < 500; i++) {
      expect(subdomainSuffix()).toMatch(/^[a-z0-9]{4}$/);
      expect(subdomainFallbackId()).toMatch(/^[a-z0-9]{6}$/);
    }
  });

  it("拼成的 host 能被 slug 规范化原样接受（即本身已合法）", () => {
    const slug = `acme-${subdomainSuffix()}`;
    expect(slugifyForSubdomain(slug)).toBe(slug);
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
});

describe("platformSubdomainRoots", () => {
  it("当前根排在最前，遗留根按逗号拆开", () => {
    expect(platformSubdomainRoots("urgizat.site", "zapbridge.site,zapbridge.xyz")).toEqual([
      "urgizat.site",
      "zapbridge.site",
      "zapbridge.xyz",
    ]);
  });

  it("去空白与空项，统一小写", () => {
    expect(platformSubdomainRoots(" URGIZAT.site ", " ZapBridge.site , ,")).toEqual([
      "urgizat.site",
      "zapbridge.site",
    ]);
  });

  it("两者都未配置时返回空数组 —— 否则空串会把所有 host 判成平台自有", () => {
    expect(platformSubdomainRoots(undefined, undefined)).toEqual([]);
    expect(platformSubdomainRoots("", "")).toEqual([]);
  });

  it("只配遗留根也成立：更名后当前根尚未就绪时不能放开抢注", () => {
    expect(platformSubdomainRoots(undefined, "zapbridge.site")).toEqual(["zapbridge.site"]);
  });
});

describe("isPlatformOwnedHost", () => {
  const ROOTS = ["urgizat.site", "zapbridge.site"];

  it("当前根的 apex 与子域都算平台自有", () => {
    expect(isPlatformOwnedHost("urgizat.site", ROOTS)).toBe(true);
    expect(isPlatformOwnedHost("acme.urgizat.site", ROOTS)).toBe(true);
  });

  it("遗留根同样拦截 —— 通配 DNS 仍指向平台，抢注是真风险", () => {
    expect(isPlatformOwnedHost("zapbridge.site", ROOTS)).toBe(true);
    expect(isPlatformOwnedHost("competitor.zapbridge.site", ROOTS)).toBe(true);
  });

  it("大小写与首尾空白不影响判定", () => {
    expect(isPlatformOwnedHost("  ACME.ZAPBRIDGE.SITE  ", ROOTS)).toBe(true);
  });

  it("仿冒后缀不放进来", () => {
    expect(isPlatformOwnedHost("evilzapbridge.site", ROOTS)).toBe(false);
    expect(isPlatformOwnedHost("zapbridge.site.evil.com", ROOTS)).toBe(false);
  });

  it("客户自有域名放行", () => {
    expect(isPlatformOwnedHost("brand.com", ROOTS)).toBe(false);
  });

  it("根列表为空时一律放行", () => {
    expect(isPlatformOwnedHost("acme.zapbridge.site", [])).toBe(false);
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
