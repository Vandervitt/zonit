import { listPresetTemplates } from "@/lib/templates-db";
import { TemplatesAdminClient } from "@/components/admin/TemplatesAdminClient";

export default async function AdminTemplatesPage() {
  const templates = await listPresetTemplates();
  return <TemplatesAdminClient initialTemplates={templates} />;
}
