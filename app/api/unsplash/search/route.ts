import { NextRequest, NextResponse } from "next/server";
import { mapUnsplashPhoto, type UnsplashRaw } from "@/lib/unsplash";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const per_page = Math.min(30, Math.max(1, parseInt(searchParams.get("per_page") ?? "8", 10) || 8));

  if (!q.trim()) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || key === "your_access_key_here") {
    return NextResponse.json({ results: [], total: 0, _demo: true });
  }

  let res: Response;
  try {
    res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&page=${page}&per_page=${per_page}&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } },
    );
  } catch {
    return NextResponse.json({ results: [], total: 0 }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ results: [], total: 0 }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({
    results: (data.results as UnsplashRaw[]).map(mapUnsplashPhoto),
    total: data.total,
  });
}
