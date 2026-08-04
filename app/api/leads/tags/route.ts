import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { listLeadTags } from "@/lib/leads/store";

/** 本租户用过的全部标签，供筛选器与输入框做候选。 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  return NextResponse.json(await listLeadTags(session.user.id));
}
