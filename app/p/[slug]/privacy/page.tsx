import type { Metadata } from "next";
import { renderTenantPolicyPage, tenantPolicyMetadata } from "../policy";

export function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return tenantPolicyMetadata(props.params, "privacy");
}

export default function TenantPrivacyPage(props: { params: Promise<{ slug: string }> }) {
  return renderTenantPolicyPage(props.params, "privacy");
}
