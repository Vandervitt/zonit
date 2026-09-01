// landing-renderer/primitives/Img.test.ts
//
// 这个组件对租户数据的三种残缺状态都必须安全降级——存量落地页里三种都真实存在。
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Img } from "./Img";

const BLOB = "https://j1vyta3wpbd7snuj.public.blob.vercel-storage.com/a.jpg";
const EXTERNAL = "https://images.unsplash.com/photo-1.jpg";
const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("Img · 优化分流", () => {
  it("白名单内输出 srcset 与 sizes，且原始 src 保留作兜底", () => {
    const out = html(createElement(Img, { image: { src: BLOB } }));
    expect(out).toContain('srcSet="/_next/image?url=');
    expect(out).toContain("sizes=");
    // 不支持 srcset 的环境（以及邮件客户端之类的抓取器）仍要能拿到图。
    expect(out).toContain(`src="${BLOB}"`);
    expect(out).toContain(encodeURIComponent(BLOB));
  });

  // 关键：/_next/image 对白名单外的 host 会 400。宁可不优化，不能让图打不开。
  it("白名单外不生成 srcset，只输出原始 src", () => {
    const out = html(createElement(Img, { image: { src: EXTERNAL } }));
    expect(out).not.toContain("/_next/image");
    // React SSR 输出的是驼峰 srcSet，断言必须按实际输出写。
    expect(out).not.toContain("srcSet");
    expect(out).not.toContain("sizes=");
    expect(out).toContain(`src="${EXTERNAL}"`);
  });
});

describe("Img · 尺寸占位（CLS）", () => {
  it("宽高齐全时输出 width/height", () => {
    const out = html(createElement(Img, { image: { src: BLOB, width: 1200, height: 800 } }));
    expect(out).toContain('width="1200"');
    expect(out).toContain('height="800"');
  });

  // 只有一个值算不出比例，输出它反而会让浏览器按错误比例占位。
  it("只有其一时两个都不输出", () => {
    const w = html(createElement(Img, { image: { src: BLOB, width: 1200 } }));
    expect(w).not.toContain('width="1200"');
    const h = html(createElement(Img, { image: { src: BLOB, height: 800 } }));
    expect(h).not.toContain('height="800"');
  });

  it("存量数据没有尺寸时照常渲染，不报错也不占位", () => {
    const out = html(createElement(Img, { image: { src: EXTERNAL } }));
    expect(out).toContain("<img");
    expect(out).not.toContain("width=");
  });
});

describe("Img · 加载优先级", () => {
  it("priority 图 eager + fetchpriority=high（首屏 LCP）", () => {
    const out = html(createElement(Img, { image: { src: BLOB }, priority: true }));
    expect(out).toContain('loading="eager"');
    expect(out).toMatch(/fetchpriority="high"/i);
  });

  it("其余图默认 lazy", () => {
    expect(html(createElement(Img, { image: { src: BLOB } }))).toContain('loading="lazy"');
  });
});
