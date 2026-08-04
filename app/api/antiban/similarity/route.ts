import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getSimilarityReport } from "@/lib/antiban/queries";

/**
 * 名下已发布页的骨架重复读数。
 *
 * 不做套餐门控：看见风险是所有人的事，能不能**打散指纹**才是 Agency 权益。
 * 把读数也锁起来等于「你有问题但不告诉你是什么」，那不是收费点，是拒绝服务。
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  return NextResponse.json(await getSimilarityReport(session.user.id));
}
