import type { ReactNode } from "react";
import { HelpNav } from "./_components/HelpNav";

export default function HelpLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      <aside style={{ width: 200, flexShrink: 0, position: "sticky", top: 16 }}>
        <HelpNav />
      </aside>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
