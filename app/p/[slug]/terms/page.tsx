import type { Metadata } from "next";
import { renderTenantPolicyPage, tenantPolicyMetadata } from "../policy";

export function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return tenantPolicyMetadata(props.params, "terms");
}

export default function TenantTermsPage(props: { params: Promise<{ slug: string }> }) {
  return renderTenantPolicyPage(props.params, "terms");
}
