import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { listLeads } from "@/lib/leads/store";
import { leadsToCsv, type LeadCsvRow } from "@/lib/leads/csv";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  // 导出跟随列表当前的筛选：筛完再导出却拿到全量，是「导出」这个动作最容易出的意外。
  // 刻意不分页——导出的用途就是拿全量去对账。
  const { searchParams } = request.nextUrl;
  const leads = await listLeads(session.user.id, {
    pageId: searchParams.get("pageId") ?? undefined,
    unreadOnly: searchParams.get("unreadOnly") === "1",
    tag: searchParams.get("tag") ?? undefined,
    archived: searchParams.get("archived") === "1",
  });
  const rows: LeadCsvRow[] = leads.map((l) => ({
    page_name: l.page_name,
    name: l.payload.name ?? "",
    email: l.payload.email ?? "",
    phone: l.payload.phone ?? "",
    whatsapp: l.payload.whatsapp ?? "",
    telegram: l.payload.telegram ?? "",
    message: l.payload.message ?? "",
    channel: l.channel ?? "",
    utm_source: l.utm_source ?? "",
    utm_medium: l.utm_medium ?? "",
    utm_campaign: l.utm_campaign ?? "",
    utm_content: l.utm_content ?? "",
    utm_term: l.utm_term ?? "",
    gclid: l.gclid ?? "",
    fbclid: l.fbclid ?? "",
    ttclid: l.ttclid ?? "",
    note: l.note ?? "",
    // 标签在单元格里用「|」分隔：逗号会被 CSV 转义成引号包裹，看着像一个长字符串
    tags: (l.tags ?? []).join("|"),
    created_at: l.created_at,
  }));
  const csv = leadsToCsv(rows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads.csv"`,
    },
  });
}
