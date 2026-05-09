"use client";

import { useEffect } from "react";
import { BeautyTemplateRenderer } from "@/components/template-extraction";
import { TemplateRenderer } from "@/components/renderer/TemplateRenderer";
import { isExtractedTemplateData, type PresetTemplateData } from "@/lib/templates";

export function PreviewRenderer({
  template,
  highlightKey = "",
  showWatermark = false,
}: {
  template: PresetTemplateData;
  highlightKey?: string;
  showWatermark?: boolean;
}) {
  useEffect(() => {
    if (!highlightKey) return;
    document.getElementById(highlightKey)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [highlightKey]);

  if (isExtractedTemplateData(template)) {
    return <BeautyTemplateRenderer template={template} />;
  }

  return (
    <TemplateRenderer
      template={template}
      highlightKey={highlightKey}
      showWatermark={showWatermark}
    />
  );
}
