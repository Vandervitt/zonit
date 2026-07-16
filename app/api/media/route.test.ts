import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "u1" } })) }));
vi.mock("@/lib/media-db", () => ({
  listMedia: vi.fn(async () => []),
  insertMedia: vi.fn(async () => ({ id: "m1", url: "https://s.public.blob.vercel-storage.com/x.jpg" })),
}));

import { POST } from "./route";
import { insertMedia } from "@/lib/media-db";

const BLOB_URL = "https://s.public.blob.vercel-storage.com/x-abc123.jpg";

const OK_BODY = {
  url: BLOB_URL,
  filename: "x.jpg",
  contentType: "image/jpeg",
  size: 9 * 1024 * 1024, // 9MB —— 旧链路会被 Vercel 413 拒，新链路应正常落库
};

function reqOf(body: unknown) {
  return new Request("http://x/api/media", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/media（直传结果落库）", () => {
  it("合法 Blob URL + 9MB 图片元数据 → 201 并入库", async () => {
    const res = await POST(reqOf(OK_BODY));
    expect(res.status).toBe(201);
    expect(insertMedia).toHaveBeenCalledWith("u1", BLOB_URL, "x.jpg", "image", 9 * 1024 * 1024);
  });

  it("非 Vercel Blob 域的 URL → 400 且不落库（防任意外链写入）", async () => {
    const res = await POST(reqOf({ ...OK_BODY, url: "https://evil.example/x.jpg" }));
    expect(res.status).toBe(400);
    expect(insertMedia).not.toHaveBeenCalled();
  });

  it("SVG 等非白名单类型 → 400 且不落库", async () => {
    const res = await POST(reqOf({ ...OK_BODY, contentType: "image/svg+xml" }));
    expect(res.status).toBe(400);
    expect(insertMedia).not.toHaveBeenCalled();
  });

  it("图片超过 10MB → 400 且不落库", async () => {
    const res = await POST(reqOf({ ...OK_BODY, size: 11 * 1024 * 1024 }));
    expect(res.status).toBe(400);
    expect(insertMedia).not.toHaveBeenCalled();
  });

  it("视频放宽到 100MB → 201 并以 video 入库", async () => {
    const res = await POST(
      reqOf({ url: BLOB_URL, filename: "v.mp4", contentType: "video/mp4", size: 80 * 1024 * 1024 }),
    );
    expect(res.status).toBe(201);
    expect(insertMedia).toHaveBeenCalledWith("u1", BLOB_URL, "v.mp4", "video", 80 * 1024 * 1024);
  });

  it("未登录 → 401", async () => {
    const { auth } = await import("@/auth");
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const res = await POST(reqOf(OK_BODY));
    expect(res.status).toBe(401);
  });
});
