import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import {
  countPagesUsingProfile,
  deleteCompanyProfile,
  updateCompanyProfile,
} from "@/lib/company-profiles/db";
import { parseCompanyProfileInput } from "@/lib/company-profiles/input";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const { id } = await params;
  const parsed = parseCompanyProfileInput(await request.json().catch(() => null));
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const row = await updateCompanyProfile(id, session.user.id, parsed.input);
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const { id } = await params;

  // 引用检查先于删除：主体信息是引用而非快照，删掉会让引用它的页面页脚当场
  // 少掉公司信息那一行，而这些页可能正在投放。让用户先把页面改到别的主体。
  const inUse = await countPagesUsingProfile(id, session.user.id);
  if (inUse > 0) {
    return NextResponse.json(
      { error: ApiErrors.COMPANY_PROFILE_IN_USE, pages: inUse },
      { status: 409 },
    );
  }

  const ok = await deleteCompanyProfile(id, session.user.id);
  if (!ok) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json({ ok: true });
}
