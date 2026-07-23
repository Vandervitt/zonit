import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { listUserMilestones } from "@/lib/platform-milestones";

/** 当前用户已达成的激活里程碑（admin 概览上手清单用）。 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const events = await listUserMilestones(session.user.id);
  return NextResponse.json({ events });
}
