import { listOpenedLinks, getOutreachSummary } from "@/lib/super-admin/page-check-views";
import { OutreachClient } from "./_client";

// 访问统计随时在变，不缓存。
export const dynamic = "force-dynamic";

export default async function OutreachPage() {
  const [rows, summary] = await Promise.all([listOpenedLinks(), getOutreachSummary()]);
  return <OutreachClient rows={rows} summary={summary} />;
}
