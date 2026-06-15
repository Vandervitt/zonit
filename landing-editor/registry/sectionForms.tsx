"use client";
// landing-editor/registry/sectionForms.tsx
// 类型安全地把 EditorSection 分派到对应表单。switch 让 TS 收窄 section.data 到具体类型。
import type { ReactNode } from "react";
import type { LandingSection } from "@/types/schema.draft";
import type { EditorSection } from "../store/editorStore";
import { StatsForm } from "../forms/StatsForm";
import { PlansForm } from "../forms/PlansForm";
import { ProductsForm } from "../forms/ProductsForm";
import { BeforeAfterForm } from "../forms/BeforeAfterForm";
import { ProcessForm } from "../forms/ProcessForm";
import { TrustForm } from "../forms/TrustForm";
import { FeaturesForm } from "../forms/FeaturesForm";
import { ReviewsForm } from "../forms/ReviewsForm";
import { StoryForm } from "../forms/StoryForm";
import { CountdownForm } from "../forms/CountdownForm";
import { FaqForm } from "../forms/FaqForm";
import { GuaranteeForm } from "../forms/GuaranteeForm";

export function renderSectionForm(
  section: EditorSection,
  onData: (data: LandingSection["data"]) => void,
): ReactNode {
  switch (section.type) {
    case "stats":
      return <StatsForm value={section.data} onChange={onData} />;
    case "plans":
      return <PlansForm value={section.data} onChange={onData} />;
    case "products":
      return <ProductsForm value={section.data} onChange={onData} />;
    case "beforeAfter":
      return <BeforeAfterForm value={section.data} onChange={onData} />;
    case "process":
      return <ProcessForm value={section.data} onChange={onData} />;
    case "trust":
      return <TrustForm value={section.data} onChange={onData} />;
    case "features":
      return <FeaturesForm value={section.data} onChange={onData} />;
    case "reviews":
      return <ReviewsForm value={section.data} onChange={onData} />;
    case "story":
      return <StoryForm value={section.data} onChange={onData} />;
    case "countdown":
      return <CountdownForm value={section.data} onChange={onData} />;
    case "faq":
      return <FaqForm value={section.data} onChange={onData} />;
    case "guarantee":
      return <GuaranteeForm value={section.data} onChange={onData} />;
  }
}
