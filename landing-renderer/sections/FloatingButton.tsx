// landing-renderer/sections/FloatingButton.tsx
import type { FloatingButton as FloatingButtonData } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";

export function FloatingButton({ data, theme }: { data: FloatingButtonData; theme: RendererTheme }) {
  return (
    <a href={data.link} className={`fixed bottom-5 right-5 z-50 inline-flex items-center rounded-full px-5 py-3 text-sm font-bold text-white ${theme.accentGradient} ${theme.accentShadow}`}>
      {data.text}
    </a>
  );
}
