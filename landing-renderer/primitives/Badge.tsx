// landing-renderer/primitives/Badge.tsx
import type { Badge as BadgeType } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";

export function Badge({ badge, theme }: { badge: BadgeType; theme: RendererTheme }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${theme.accentSoftBg} ${theme.accentSoftBorder} ${theme.accentSoftText}`}>
      {badge.emoji && <span aria-hidden>{badge.emoji}</span>}
      {badge.text}
    </span>
  );
}
