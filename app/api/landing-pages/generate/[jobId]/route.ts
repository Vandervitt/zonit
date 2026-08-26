import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getAiJob } from "@/lib/landing-pages/ai-jobs";

/** AI 一键成页异步任务的状态查询，供编辑器轮询。 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { jobId } = await params;

  const job = await getAiJob(jobId, session.user.id);
  if (!job) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });

  return NextResponse.json({ status: job.status, reason: job.reason });
}
