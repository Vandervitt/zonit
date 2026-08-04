import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { markLeadRead, deleteLead, updateLeadFollowUp } from "@/lib/leads/store";
import { normalizeNote, normalizeTags } from "@/lib/leads/follow-up";

/**
 * 更新线索：已读状态、跟进备注、标签、归档。
 * 只处理请求里显式出现的字段——前端改备注时不该顺带把标签清空。
 */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/leads/[id]">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));

  const followUp: { note?: string | null; tags?: string[]; archived?: boolean } = {};
  if ("note" in body) followUp.note = normalizeNote(body.note);
  if ("tags" in body) followUp.tags = normalizeTags(body.tags);
  if ("archived" in body) followUp.archived = Boolean(body.archived);

  if (Object.keys(followUp).length > 0) {
    const row = await updateLeadFollowUp(id, session.user.id, followUp);
    if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
    // 同一次请求里也可能带 isRead（如「写完备注顺手标已读」）
    if ("isRead" in body) {
      const updated = await markLeadRead(id, session.user.id, Boolean(body.isRead));
      return NextResponse.json(updated ?? row);
    }
    return NextResponse.json(row);
  }

  const row = await markLeadRead(id, session.user.id, Boolean(body.isRead));
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/leads/[id]">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const ok = await deleteLead(id, session.user.id);
  if (!ok) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
