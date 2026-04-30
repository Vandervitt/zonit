import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? "";
  const page = searchParams.get("page") ?? "1";
  const per_page = searchParams.get("per_page") ?? "8";

  if (!q.trim()) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || key === "your_access_key_here") {
    return NextResponse.json({ results: [], total: 0, _demo: true });
  }

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&page=${page}&per_page=${per_page}&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${key}` } },
  );

  if (!res.ok) {
    return NextResponse.json({ results: [], total: 0 }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({
    results: data.results.map((p: {
      id: string;
      urls: { small: string; regular: string };
      alt_description: string | null;
      user: { name: string; username: string };
    }) => ({
      id: p.id,
      urls: { small: p.urls.small, regular: p.urls.regular },
      alt_description: p.alt_description,
      user: { name: p.user.name, username: p.user.username },
    })),
    total: data.total,
  });
}
