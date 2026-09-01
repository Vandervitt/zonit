// landing-renderer/primitives/Media.test.ts
//
// 回归：2026-09-01 给落地页图片加优化时只改了 Img，而 Hero 走的是 Media，
// 于是首屏 LCP 那张图成了整页唯一没走优化器的（84KiB 原始 JPEG，
// 占当时剩余图片重量的一半以上）。这组用例钉住「Media 的图片分支与 Img 同款」。
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Media } from "./Media";

const BLOB = "https://j1vyta3wpbd7snuj.public.blob.vercel-storage.com/a.jpg";
const EXTERNAL = "https://images.unsplash.com/photo-1.jpg";
const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("Media · 图片分支与 Img 行为一致", () => {
  it("白名单内的图同样走优化器", () => {
    const out = html(createElement(Media, { media: { type: "image", src: BLOB } }));
    expect(out).toContain('srcSet="/_next/image?url=');
    expect(out).toContain("sizes=");
  });

  it("白名单外仍原样输出（/_next/image 对它会 400）", () => {
    const out = html(createElement(Media, { media: { type: "image", src: EXTERNAL } }));
    expect(out).not.toContain("/_next/image");
    expect(out).toContain(`src="${EXTERNAL}"`);
  });

  it("有尺寸时输出 width/height 占位", () => {
    const out = html(
      createElement(Media, { media: { type: "image", src: BLOB, width: 1600, height: 900 } }),
    );
    expect(out).toContain('width="1600"');
    expect(out).toContain('height="900"');
  });

  it("alt 与 priority 照常透传（Hero 主图是 LCP 元素）", () => {
    const out = html(
      createElement(Media, { media: { type: "image", src: BLOB, alt: "hero" }, priority: true }),
    );
    expect(out).toContain('alt="hero"');
    expect(out).toContain('loading="eager"');
    expect(out).toMatch(/fetchpriority="high"/i);
  });
});

describe("Media · 视频分支不受影响", () => {
  it("视频仍渲染 <video>，不套图片优化", () => {
    const out = html(
      createElement(Media, {
        media: { type: "video", src: "https://x.com/v.mp4", poster: "https://x.com/p.jpg" },
      }),
    );
    expect(out).toContain("<video");
    expect(out).toContain('poster="https://x.com/p.jpg"');
    expect(out).not.toContain("/_next/image");
    expect(out).not.toContain("<img");
  });
});
