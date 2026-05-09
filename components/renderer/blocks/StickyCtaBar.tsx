"use client";

import { useEffect, useState } from "react";
import type { StickyCtaConfig } from "@/types/schema";
import { LeadCta } from "@/components/renderer/LeadCta";

export function StickyCtaBar({
  cta,
  primaryColor,
}: {
  cta: StickyCtaConfig;
  primaryColor: string;
}) {
  const threshold = cta.showAfterScrollPercent ?? 0;
  const [visible, setVisible] = useState(threshold === 0);

  useEffect(() => {
    if (threshold === 0) return;
    const check = () => {
      const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      setVisible(scrolled >= threshold);
    };
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [threshold]);

  if (!visible) return null;

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-3 py-2 z-40">
      <LeadCta
        cta={cta}
        primaryColor={primaryColor}
        className="w-full py-2.5 rounded-full text-sm text-white font-medium"
      />
    </div>
  );
}
