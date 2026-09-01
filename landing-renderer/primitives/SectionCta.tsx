// landing-renderer/primitives/SectionCta.tsx
//
// 区块级 CTA 的统一落位：居中、与上方内容留出固定间距。
//
// 单独抽出来是为了让 features / process / reviews 三处长得一样——分别手写
// 迟早会各自漂移成三种间距。cta 未填时返回 null，因此调用方无需自己判空。
//
// 「未填完整时线上不渲染、预览渲染占位」这条规则完全交给 Cta 本身，
// 这里不重复实现（重复实现 = 两处规则迟早不一致）。
import type { CtaButton, PageContact } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { Cta } from "./Cta";

export function SectionCta({
  cta,
  contact,
  theme,
  preview = false,
}: {
  cta?: CtaButton;
  contact: PageContact;
  theme: RendererTheme;
  preview?: boolean;
}) {
  if (!cta) return null;
  return (
    <div className="mt-8 flex justify-center">
      <Cta cta={cta} contact={contact} theme={theme} preview={preview} />
    </div>
  );
}
