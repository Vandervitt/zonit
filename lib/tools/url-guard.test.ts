// lib/tools/url-guard.test.ts
//
// SSRF 防护是本功能安全性的全部——接受任意用户 URL 在服务端抓取，是教科书级
// SSRF 入口。这组测试按「必须被拒绝」的清单写，每一条对应一种真实攻击路径。
// 设计文档见 docs/feat_20260802_落地页自检器/design.md 第六节。
import { describe, it, expect } from "vitest";
import { isBlockedAddress, parseTargetUrl, guardUrl } from "./url-guard";

describe("parseTargetUrl · 入口校验（同步，不含 DNS）", () => {
  it("接受正常的 https 地址", () => {
    const r = parseTargetUrl("https://example.com/lp?a=1");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url.hostname).toBe("example.com");
  });

  it.each([
    ["http://example.com/", "scheme_not_https"],
    ["file:///etc/passwd", "scheme_not_https"],
    ["data:text/html,<h1>x", "scheme_not_https"],
    ["gopher://example.com/", "scheme_not_https"],
    ["javascript:alert(1)", "scheme_not_https"],
    ["ftp://example.com/", "scheme_not_https"],
  ])("拒绝非 https scheme：%s", (raw, reason) => {
    const r = parseTargetUrl(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe(reason);
  });

  it("拒绝 URL 内嵌凭据（绕过鉴权的常见手法）", () => {
    const r = parseTargetUrl("https://user:pass@example.com/");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("credentials_in_url");
  });

  it("拒绝非 443 端口", () => {
    const r = parseTargetUrl("https://example.com:8080/");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("port_not_allowed");
  });

  it("显式写出 :443 视为合法", () => {
    expect(parseTargetUrl("https://example.com:443/").ok).toBe(true);
  });

  it.each([
    "https://127.0.0.1/",
    "https://10.0.0.1/",
    "https://[::1]/",
    "https://[::ffff:127.0.0.1]/",
  ])("拒绝 IP 字面量主机名：%s", (raw) => {
    const r = parseTargetUrl(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("ip_literal_host");
  });

  it("拒绝无法解析的输入", () => {
    expect(parseTargetUrl("not a url").ok).toBe(false);
    expect(parseTargetUrl("").ok).toBe(false);
  });

  // 经典绕过：把 127.0.0.1 写成整数 / 十六进制 / 八进制 / 短形式。
  // 这些之所以被拦住，是因为 WHATWG URL 解析器会先把数值主机名**归一化**成
  // 点分十进制，`ip_literal_host` 才抓得到。这是实现细节而非显式逻辑，
  // 故用测试钉住——有人若把 ip_literal 检查改成正则匹配点分格式就会破功。
  it.each([
    ["https://2130706433/", "十进制整数"],
    ["https://0x7f000001/", "十六进制"],
    ["https://017700000001/", "八进制"],
    ["https://127.1/", "短形式"],
  ])("拒绝数值形式的回环地址：%s（%s）", (raw) => {
    const r = parseTargetUrl(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("ip_literal_host");
  });
});

describe("isBlockedAddress · 地址段判定", () => {
  it.each([
    ["0.0.0.0", "本网段"],
    ["0.1.2.3", "本网段"],
    ["10.0.0.1", "私网 A"],
    ["10.255.255.254", "私网 A"],
    ["127.0.0.1", "回环"],
    ["127.255.255.255", "回环"],
    ["169.254.1.1", "链路本地"],
    ["169.254.169.254", "云元数据端点"],
    ["172.16.0.1", "私网 B 下界"],
    ["172.31.255.254", "私网 B 上界"],
    ["192.168.1.1", "私网 C"],
    ["100.64.0.1", "CGNAT 下界"],
    ["100.127.255.254", "CGNAT 上界"],
    ["224.0.0.1", "组播"],
    ["240.0.0.1", "保留"],
    ["255.255.255.255", "广播"],
  ])("拦截 IPv4 %s（%s）", (ip) => {
    expect(isBlockedAddress(ip)).toBe(true);
  });

  it.each([
    ["::1", "IPv6 回环"],
    ["::", "未指定地址"],
    ["fc00::1", "唯一本地"],
    ["fd12:3456::1", "唯一本地"],
    ["fe80::1", "链路本地"],
  ])("拦截 IPv6 %s（%s）", (ip) => {
    expect(isBlockedAddress(ip)).toBe(true);
  });

  // 最常见的绕过：把内网地址写成 IPv4-mapped IPv6，只按 IPv6 规则判就会放过。
  it.each([
    "::ffff:127.0.0.1",
    "::ffff:10.0.0.1",
    "::ffff:169.254.169.254",
    "::ffff:192.168.0.1",
    "::FFFF:127.0.0.1",
  ])("拦截 IPv4-mapped IPv6：%s（必须解包后按 IPv4 规则判）", (ip) => {
    expect(isBlockedAddress(ip)).toBe(true);
  });

  it.each([
    "8.8.8.8",
    "1.1.1.1",
    "93.184.216.34",
    "172.32.0.1",
    "172.15.255.255",
    "100.63.255.255",
    "100.128.0.1",
    "2606:4700:4700::1111",
  ])("放行公网地址：%s", (ip) => {
    expect(isBlockedAddress(ip)).toBe(false);
  });

  it("172.16/12 的边界两侧判定正确", () => {
    expect(isBlockedAddress("172.15.255.255")).toBe(false);
    expect(isBlockedAddress("172.16.0.0")).toBe(true);
    expect(isBlockedAddress("172.31.255.255")).toBe(true);
    expect(isBlockedAddress("172.32.0.0")).toBe(false);
  });
});

describe("guardUrl · 含 DNS 解析", () => {
  const resolveTo = (addrs: string[]) => async () => addrs;

  it("全部解析结果均为公网时放行，并回传已校验地址", async () => {
    const r = await guardUrl("https://example.com/", { resolve: resolveTo(["93.184.216.34"]) });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.addresses).toEqual(["93.184.216.34"]);
  });

  // DNS 可返回多条记录，只查第一条等于留了个后门。
  it("任一解析结果落入内网即拒绝（不是只看第一条）", async () => {
    const r = await guardUrl("https://evil.example/", {
      resolve: resolveTo(["93.184.216.34", "127.0.0.1"]),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("private_address");
  });

  it("解析结果为空视为失败", async () => {
    const r = await guardUrl("https://example.com/", { resolve: resolveTo([]) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("dns_failed");
  });

  it("解析抛错时归为 dns_failed 而不是放行", async () => {
    const r = await guardUrl("https://example.com/", {
      resolve: async () => { throw new Error("ENOTFOUND"); },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("dns_failed");
  });

  it("入口校验失败时不进行 DNS 解析", async () => {
    let called = false;
    const r = await guardUrl("http://example.com/", {
      resolve: async () => { called = true; return ["93.184.216.34"]; },
    });
    expect(r.ok).toBe(false);
    expect(called, "scheme 不合法时不应发起 DNS 查询").toBe(false);
  });
});

describe("guardUrl · 域名指向内网的真实攻击面", () => {
  // nip.io / sslip.io 这类服务把内网地址编码进域名，是绕过「只看主机名」式
  // 校验的标准手法。唯一有效的防线是解析之后再判地址。
  it.each([
    ["https://127.0.0.1.nip.io/", "127.0.0.1"],
    ["https://10.0.0.1.sslip.io/", "10.0.0.1"],
    ["https://metadata.example/", "169.254.169.254"],
  ])("拦截解析到内网的正常域名：%s", async (raw, resolvesTo) => {
    const r = await guardUrl(raw, { resolve: async () => [resolvesTo] });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("private_address");
      expect(r.detail).toBe(resolvesTo);
    }
  });

  it("双栈站点中只要 AAAA 指向内网即拒绝", async () => {
    const r = await guardUrl("https://dual.example/", {
      resolve: async () => ["93.184.216.34", "::1"],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("private_address");
  });
});
