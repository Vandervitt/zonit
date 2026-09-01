// lib/images/optimizable.test.ts
//
// 白名单判错的两种后果都不会立刻被人发现：
//   判宽了 → /_next/image 对非白名单 host 返回 400，图直接打不开；
//   判窄了 → 优化静默失效，图还在只是白白大几百 KiB。
import { describe, it, expect } from "vitest";
import {
  isOptimizableImageSrc,
  optimizedSrcSet,
  optimizedImageUrl,
  OPTIMIZABLE_IMAGE_HOSTS,
} from "./optimizable";

const BLOB = "https://j1vyta3wpbd7snuj.public.blob.vercel-storage.com/unsplash-1787906.jpg";

describe("isOptimizableImageSrc", () => {
  it("命中通配子域与精确 host", () => {
    expect(isOptimizableImageSrc(BLOB)).toBe(true);
    expect(isOptimizableImageSrc("https://lh3.googleusercontent.com/a/x=s96")).toBe(true);
  });

  it("白名单外的外链一律不优化（否则 /_next/image 会 400，图打不开）", () => {
    expect(isOptimizableImageSrc("https://images.unsplash.com/photo-1.jpg")).toBe(false);
    expect(isOptimizableImageSrc("https://evil.example.com/a.png")).toBe(false);
  });

  // 后缀匹配不能退化成 endsWith：attacker 可以注册这样的域名。
  it("仿冒后缀不算命中", () => {
    expect(isOptimizableImageSrc("https://notpublic.blob.vercel-storage.com.evil.com/a.png")).toBe(false);
    expect(isOptimizableImageSrc("https://xlh3.googleusercontent.com/a.png")).toBe(false);
  });

  it("通配只匹配子域，不匹配 apex 本身", () => {
    expect(isOptimizableImageSrc("https://public.blob.vercel-storage.com/a.png")).toBe(false);
  });

  it("大小写不敏感", () => {
    expect(isOptimizableImageSrc(BLOB.replace("public.blob", "PUBLIC.BLOB"))).toBe(true);
  });

  it("相对路径与非法 URL 不优化，且不抛错", () => {
    expect(isOptimizableImageSrc("/local.png")).toBe(false);
    expect(isOptimizableImageSrc("")).toBe(false);
    expect(isOptimizableImageSrc("not a url")).toBe(false);
  });
});

describe("optimizedSrcSet", () => {
  it("白名单内生成多档 srcset，宽度递增且带 w 描述符", () => {
    const set = optimizedSrcSet(BLOB)!;
    const widths = [...set.matchAll(/ (\d+)w/g)].map((m) => Number(m[1]));
    expect(widths.length).toBeGreaterThan(1);
    expect([...widths].sort((a, b) => a - b)).toEqual(widths);
  });

  // ⚠️ Next 会校验 w：不在 deviceSizes 表内直接 400。
  it("所有宽度都在 Next 默认 deviceSizes 内", () => {
    const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
    for (const m of optimizedSrcSet(BLOB)!.matchAll(/ (\d+)w/g)) {
      expect(DEVICE_SIZES).toContain(Number(m[1]));
    }
  });

  // ⚠️ qualities 默认只允许 75，传别的值同样 400。
  it("quality 固定 75", () => {
    expect(optimizedImageUrl(BLOB, 640)).toContain("q=75");
  });

  it("原始 URL 被正确编码，查询串不会截断", () => {
    const withQuery = "https://x.public.blob.vercel-storage.com/a.png?v=1&t=2";
    const url = optimizedImageUrl(withQuery, 640);
    expect(url).toContain(encodeURIComponent(withQuery));
    expect(url).not.toContain("?v=1&t=2&w=");
  });

  it("白名单外返回 undefined，调用方据此退回原始 src", () => {
    expect(optimizedSrcSet("https://images.unsplash.com/photo-1.jpg")).toBeUndefined();
  });
});

describe("与 next.config 的一致性", () => {
  // 两份名单漂移是这套机制唯一的静默失效方式，故把「事实源只有一份」钉住。
  it("白名单非空且形如 host 或 *.host", () => {
    expect(OPTIMIZABLE_IMAGE_HOSTS.length).toBeGreaterThan(0);
    for (const p of OPTIMIZABLE_IMAGE_HOSTS) expect(p).toMatch(/^(\*\.)?[a-z0-9.-]+$/);
  });
});
