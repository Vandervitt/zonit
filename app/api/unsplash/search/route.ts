import { NextRequest, NextResponse } from "next/server";
import { searchPhotos } from "@/lib/media/unsplash";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const per_page = Math.min(30, Math.max(1, parseInt(searchParams.get("per_page") ?? "8", 10) || 8));

  try {
    const { results, total, demo } = await searchPhotos(q, page, per_page);
    return NextResponse.json(demo ? { results, total, _demo: true } : { results, total });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 502;
    return NextResponse.json({ results: [], total: 0 }, { status });
  }
}
