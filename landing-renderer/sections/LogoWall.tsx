// landing-renderer/sections/LogoWall.tsx
import type { LogoWallSection } from "@/types/schema.draft";
import { SectionShell } from "../primitives/SectionShell";
import { SectionHeading } from "../primitives/SectionHeading";
import { Img } from "../primitives/Img";

export function LogoWall({ data }: { data: LogoWallSection }) {
  return (
    <SectionShell>
      <SectionHeading title={data.title} subtitle={data.subtitle} />
      {data.items.length > 0 && (
        <div className="mt-8 grid grid-cols-2 items-center gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {data.items.map((it, i) => (
            // grayscale + hover 还原是 logo 墙的通行处理：让一排风格各异的品牌标识
            // 在视觉上统一，不至于喧宾夺主盖过本页自己的主色。
            <div key={i} className="flex items-center justify-center">
              {/* name 兼作 alt：schema 里承诺了它是无障碍与 SEO 的来源，
                  这里必须真的传下去，否则那句注释就是假的。图上已有 alt 时以图为准。 */}
              <Img
                image={{ ...it.image, alt: it.image.alt ?? it.name }}
                className="h-10 w-auto max-w-[8rem] object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
              />
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
