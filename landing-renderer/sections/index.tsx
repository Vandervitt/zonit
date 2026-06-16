// landing-renderer/sections/index.tsx
// 按 section.type 分发到对应区块组件。switch 为穷尽匹配：
// 新增 LandingSectionType 而未在此补 case 时，assertNever 会触发编译错误。
import type { LandingSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { Stats } from "./Stats";
import { Plans } from "./Plans";
import { Products } from "./Products";
import { BeforeAfter } from "./BeforeAfter";
import { Process } from "./Process";
import { Trust } from "./Trust";
import { Features } from "./Features";
import { Reviews } from "./Reviews";
import { Story } from "./Story";
import { CountdownBanner } from "./CountdownBanner";
import { Faq } from "./Faq";
import { Guarantee } from "./Guarantee";

function assertNever(x: never): null {
  void x;
  return null;
}

export function renderSection(section: LandingSection, theme: RendererTheme, key: number) {
  switch (section.type) {
    case "stats":       return <Stats key={key} data={section.data} theme={theme} />;
    case "plans":       return <Plans key={key} data={section.data} theme={theme} />;
    case "products":    return <Products key={key} data={section.data} />;
    case "beforeAfter": return <BeforeAfter key={key} data={section.data} theme={theme} />;
    case "process":     return <Process key={key} data={section.data} theme={theme} />;
    case "trust":       return <Trust key={key} data={section.data} />;
    case "features":    return <Features key={key} data={section.data} theme={theme} />;
    case "reviews":     return <Reviews key={key} data={section.data} theme={theme} />;
    case "story":       return <Story key={key} data={section.data} theme={theme} />;
    case "countdown":   return <CountdownBanner key={key} data={section.data} theme={theme} />;
    case "faq":         return <Faq key={key} data={section.data} theme={theme} />;
    case "guarantee":   return <Guarantee key={key} data={section.data} />;
    default:            return assertNever(section);
  }
}
