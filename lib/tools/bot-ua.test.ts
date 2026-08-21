import { describe, it, expect } from "vitest";
import { isLikelyBot } from "./bot-ua";

describe("isLikelyBot", () => {
  it("放行真实浏览器 UA", () => {
    const real = [
      // 桌面 Chrome
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      // iOS Safari——外发邮件多在手机上打开，误判这条等于把主力样本清零
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      // 桌面 Firefox
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
      // Android Chrome
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
    ];
    for (const ua of real) {
      expect(isLikelyBot(ua), ua).toBe(false);
    }
  });

  it("识别邮件安全网关与链接扫描器", () => {
    // 这类抓取与真人打开在服务端完全同形，是打开率被高估的主要来源。
    const scanners = [
      "Mozilla/5.0 (compatible; proofpoint-urldefense)",
      "Mimecast Link Scanner",
      "Barracuda Sentinel Link Protection",
      "Microsoft Office Outlook 16.0",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SkypeUriPreview Preview/0.5",
    ];
    for (const ua of scanners) {
      expect(isLikelyBot(ua), ua).toBe(true);
    }
  });

  it("识别爬虫、抓取库与无头浏览器", () => {
    const bots = [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0)",
      "curl/8.4.0",
      "Wget/1.21.4",
      "python-requests/2.31.0",
      "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/127.0.0.0",
      "facebookexternalhit/1.1",
      "Slackbot-LinkExpanding 1.0",
      "TelegramBot (like TwitterBot)",
    ];
    for (const ua of bots) {
      expect(isLikelyBot(ua), ua).toBe(true);
    }
  });

  it("缺失或空 UA 记为机器人", () => {
    // 真实浏览器一定带 UA；不带的要么是脚本要么是刻意隐藏，都不该算真人打开。
    expect(isLikelyBot(null)).toBe(true);
    expect(isLikelyBot(undefined)).toBe(true);
    expect(isLikelyBot("")).toBe(true);
    expect(isLikelyBot("   ")).toBe(true);
  });

  it("大小写不敏感", () => {
    expect(isLikelyBot("GOOGLEBOT/2.1")).toBe(true);
    expect(isLikelyBot("CURL/8.4.0")).toBe(true);
  });
});
