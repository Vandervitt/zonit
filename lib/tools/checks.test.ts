// lib/tools/checks.test.ts
//
// A 档检查全部是「是非题」——每条都能追溯到一个可核实的客观事实，
// 这是报告不给评分、不承诺过审的前提（设计文档第二节）。
import { describe, it, expect } from "vitest";
import {
  extractAnchors,
  findPolicyLinks,
  detectContact,
  detectTrackers,
  countBlockingScripts,
  findCopyrightYear,
} from "./checks";

const BASE = new URL("https://example.com/lp");

describe("extractAnchors", () => {
  it("提取 href 与去标签后的可见文字", () => {
    const html = `<a href="/privacy">Privacy Policy</a><a href='/terms'><span>Terms</span> of use</a>`;
    expect(extractAnchors(html)).toEqual([
      { href: "/privacy", text: "privacy policy" },
      { href: "/terms", text: "terms of use" },
    ]);
  });

  it("忽略 mailto 与 javascript 伪链接", () => {
    const html = `<a href="mailto:a@b.com">Mail</a><a href="javascript:void(0)">x</a><a href="/ok">ok</a>`;
    expect(extractAnchors(html).map((a) => a.href)).toEqual(["/ok"]);
  });

  it("锚点内嵌套标签不影响解析", () => {
    const html = `<a class="x" href="/p" data-y="1"><svg></svg> <b>隐私</b>政策 </a>`;
    expect(extractAnchors(html)).toEqual([{ href: "/p", text: "隐私政策" }]);
  });
});

describe("findPolicyLinks · 隐私政策与服务条款", () => {
  it("按英文链接文字识别", () => {
    const html = `<a href="/privacy-policy">Privacy Policy</a><a href="/tos">Terms of Service</a>`;
    const r = findPolicyLinks(html, BASE);
    expect(r.privacy).toBe("https://example.com/privacy-policy");
    expect(r.terms).toBe("https://example.com/tos");
  });

  it("按中文链接文字识别", () => {
    const html = `<a href="/yinsi">隐私政策</a><a href="/tk">服务条款</a>`;
    const r = findPolicyLinks(html, BASE);
    expect(r.privacy).toBe("https://example.com/yinsi");
    expect(r.terms).toBe("https://example.com/tk");
  });

  it("链接文字无关时退而按 href 路径识别", () => {
    const html = `<a href="/legal/privacy">了解更多</a>`;
    expect(findPolicyLinks(html, BASE).privacy).toBe("https://example.com/legal/privacy");
  });

  it("都没有时返回 undefined", () => {
    const r = findPolicyLinks(`<a href="/about">About</a>`, BASE);
    expect(r.privacy).toBeUndefined();
    expect(r.terms).toBeUndefined();
  });

  it("相对与绝对 href 都归一化为绝对地址", () => {
    const html = `<a href="https://cdn.example.net/p">Privacy</a>`;
    expect(findPolicyLinks(html, BASE).privacy).toBe("https://cdn.example.net/p");
  });
});

describe("detectContact · 经营主体与联系方式", () => {
  it("识别 mailto 与纯文本邮箱", () => {
    expect(detectContact(`<a href="mailto:hi@x.com">写信</a>`).email).toBe(true);
    expect(detectContact(`<p>contact: hi@x.com</p>`).email).toBe(true);
  });

  it("识别 tel: 与常见号码写法", () => {
    expect(detectContact(`<a href="tel:+15551234567">call</a>`).phone).toBe(true);
    expect(detectContact(`<p>+1 (555) 123-4567</p>`).phone).toBe(true);
  });

  it("都没有时两项均为 false", () => {
    const r = detectContact(`<p>just some copy</p>`);
    expect(r.email).toBe(false);
    expect(r.phone).toBe(false);
  });

  it("不把版本号之类的数字误判成电话", () => {
    expect(detectContact(`<p>v1.2.3 build 20260802</p>`).phone).toBe(false);
  });
});

describe("detectTrackers · 静态像素启发式（匿名侧主路径）", () => {
  it("识别 Meta Pixel", () => {
    const r = detectTrackers(`<script>!function(f,b,e){fbq('init','123')}</script>`);
    expect(r.pixels).toContain("meta");
  });

  it("识别 GA4 / Google Ads", () => {
    const r = detectTrackers(`<script src="https://www.googletagmanager.com/gtag/js?id=G-X"></script>`);
    expect(r.pixels).toContain("google");
  });

  it("识别 TikTok Pixel", () => {
    expect(detectTrackers(`<script>ttq.load('XYZ')</script>`).pixels).toContain("tiktok");
  });

  it("无追踪代码时为空", () => {
    expect(detectTrackers(`<script>console.log(1)</script>`).pixels).toEqual([]);
  });

  it("识别常见 CMP（同意管理平台）", () => {
    const r = detectTrackers(`<script src="https://consent.cookiebot.com/uc.js"></script><script>fbq('init')</script>`);
    expect(r.cmp).toBe("cookiebot");
  });

  // 判据：有像素、但没有任何同意门控迹象 → 疑似同意前触发。
  it("有像素且无 CMP → 疑似同意前触发", () => {
    const r = detectTrackers(`<script>fbq('init','1')</script>`);
    expect(r.suspectedBeforeConsent).toBe(true);
  });

  it("有像素但被 type=text/plain 挂起 → 不判为疑似", () => {
    const r = detectTrackers(
      `<script type="text/plain" data-cookieconsent="marketing">fbq('init','1')</script>`,
    );
    expect(r.suspectedBeforeConsent).toBe(false);
  });

  it("有 CMP 时不判为疑似（留给登录用户实测确认）", () => {
    const r = detectTrackers(
      `<script src="https://cdn.cookielaw.org/otSDKStub.js"></script><script>fbq('init')</script>`,
    );
    expect(r.cmp).toBe("onetrust");
    expect(r.suspectedBeforeConsent).toBe(false);
  });

  it("没有像素就无所谓同意前后", () => {
    expect(detectTrackers(`<p>no scripts</p>`).suspectedBeforeConsent).toBe(false);
  });
});

describe("countBlockingScripts", () => {
  it("只数会阻塞渲染的同步外链脚本", () => {
    const html = `
      <script src="/a.js"></script>
      <script src="/b.js" defer></script>
      <script src="/c.js" async></script>
      <script>inline()</script>
      <script src="/d.js"></script>`;
    expect(countBlockingScripts(html)).toBe(2);
  });

  it("无脚本时为 0", () => {
    expect(countBlockingScripts(`<p>x</p>`)).toBe(0);
  });
});

describe("findCopyrightYear", () => {
  it("识别 © 2026 与 Copyright 2026", () => {
    expect(findCopyrightYear(`<p>© 2026 Acme</p>`)).toBe(2026);
    expect(findCopyrightYear(`<p>Copyright 2024 Acme</p>`)).toBe(2024);
  });

  it("年份区间取较大的一端", () => {
    expect(findCopyrightYear(`<p>© 2019-2025 Acme</p>`)).toBe(2025);
  });

  it("没有版权行时返回 null", () => {
    expect(findCopyrightYear(`<p>Acme</p>`)).toBeNull();
  });

  it("不把无关的四位数字当年份", () => {
    expect(findCopyrightYear(`<p>Suite 2026, Main St</p>`)).toBeNull();
  });
});
