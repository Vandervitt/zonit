import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { listLeads } from "@/lib/leads/store";
import { leadsToCsv, type LeadCsvRow } from "@/lib/leads/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const leads = await listLeads(session.user.id);
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
