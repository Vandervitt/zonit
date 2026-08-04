import type { Metadata } from "next";
import { previewPolicyMetadata, renderPreviewPolicyPage } from "../policy";

export function generateMetadata(): Promise<Metadata> {
  return previewPolicyMetadata();
}

export default function PreviewPrivacyPage(props: { params: Promise<{ token: string }> }) {
  return renderPreviewPolicyPage(props.params, "privacy");
}
