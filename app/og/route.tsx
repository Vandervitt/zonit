import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo/site";

// 品牌 OG 卡片（1200×630），供平台营销页显式引用（见 lib/seo/site.ts）。
// 说明：ImageResponse 仅接受内联 style 对象（其唯一 API），不进入 Tailwind DOM
// 体系，故此处内联样式不违反「仅 Tailwind」约束；文案用拉丁字符，规避
// @vercel/og 默认字体不含 CJK 字形导致的豆腐块。
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "96px",
          background:
            "linear-gradient(135deg, #0b1220 0%, #0f2733 60%, #082530 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "#22d3ee",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: "30px",
              fontWeight: 700,
              color: "#22d3ee",
              letterSpacing: "3px",
            }}
          >
            OVERSEAS LEAD-GEN LANDING PAGES
          </div>
        </div>
        <div
          style={{
            fontSize: "134px",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1,
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            fontSize: "44px",
            color: "#cbd5e1",
            marginTop: "34px",
            maxWidth: "920px",
            lineHeight: 1.3,
          }}
        >
          High-converting landing pages, published on your own domain.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "56px",
            height: "10px",
            width: "240px",
            borderRadius: "9999px",
            background: "#22d3ee",
          }}
        />
      </div>
    ),
    size,
  );
}
