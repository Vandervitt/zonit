import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "u1" } })) }));
vi.mock("@vercel/blob", () => ({ put: vi.fn(async () => ({ url: "https://blob.example/img-xyz.jpg" })) }));
vi.mock("@/lib/media-db", () => ({ insertMedia: vi.fn(async () => ({ id: "m1", url: "https://blob.example/img-xyz.jpg" })) }));

import { POST } from "./route";
import { put } from "@vercel/blob";
import { insertMedia } from "@/lib/media-db";

const OK_BODY = {
  downloadLocation: "https://api.unsplash.com/photos/abc/download",
  imageUrl: "https://images.unsplash.com/r.jpg",
  creditName: "Jane Doe",
  creditUrl: "https://unsplash.com/@jane?utm_source=zap_bridge&utm_medium=referral",
  alt: "beach",
};

function reqOf(body: unknown) {
  return new Request("http://x/api/media/unsplash", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.UNSPLASH_ACCESS_KEY = "test-key";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.startsWith("https://api.unsplash.com/")) return new Response("{}", { status: 200 });
      return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "image/jpeg" } });
    }),
  );
});

describe("POST /api/media/unsplash", () => {
  it("触发下载计数、落 Blob、以 source=unsplash 入库", async () => {
    const res = await POST(reqOf(OK_BODY));
    expect(res.status).toBe(201);

    const calls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(calls).toContain("https://api.unsplash.com/photos/abc/download");

    expect(put).toHaveBeenCalledOnce();
    expect(insertMedia).toHaveBeenCalledWith(
      "u1",
      "https://blob.example/img-xyz.jpg",
      expect.any(String),
      "image",
      3,
      { source: "unsplash", creditName: "Jane Doe", creditUrl: OK_BODY.creditUrl },
    );
  });

  it("imageUrl 非 Unsplash 域时拒绝（防 SSRF），不落库", async () => {
    const res = await POST(reqOf({ ...OK_BODY, imageUrl: "https://evil.example/x.jpg" }));
    expect(res.status).toBe(400);
    expect(insertMedia).not.toHaveBeenCalled();
  });

  it("恶意 creditUrl（非 https unsplash.com）落库时被清成 null", async () => {
    const res = await POST(reqOf({ ...OK_BODY, creditUrl: "javascript:alert(1)" }));
    expect(res.status).toBe(201);
    expect(insertMedia).toHaveBeenCalledWith(
      "u1",
      "https://blob.example/img-xyz.jpg",
      expect.any(String),
      "image",
      3,
      { source: "unsplash", creditName: "Jane Doe", creditUrl: null },
    );
  });

  it("未登录返回 401", async () => {
    const { auth } = await import("@/auth");
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const res = await POST(reqOf(OK_BODY));
    expect(res.status).toBe(401);
  });
});
