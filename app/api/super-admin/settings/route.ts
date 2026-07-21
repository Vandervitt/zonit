import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole, ApiErrors } from "@/lib/constants";
import {
  getFounderContact,
  setFounderContact,
  type FounderContact,
} from "@/lib/platform-settings";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 }) };
  }
  if (session.user.role !== UserRole.SUPER_ADMIN) {
    return { error: NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 403 }) };
  }
  return { session };
}

const MAX_LEN = 500;

// 校验并归一化单个字符串字段（trim + 长度上限）。
function normalizeField(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length > MAX_LEN) return null;
  return trimmed;
}

export async function GET() {
  const guard = await requireSuperAdmin();
  if (guard.error) return guard.error;
  return NextResponse.json({ founderContact: await getFounderContact() });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireSuperAdmin();
  if (guard.error) return guard.error;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  const patch: Partial<FounderContact> = {};
  for (const field of ["wechatId", "wechatQrUrl", "email"] as const) {
    if (field in body) {
      const value = normalizeField(body[field]);
      if (value === null) {
        return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
      }
      patch[field] = value;
    }
  }

  // 邮箱非空时做轻量格式校验（允许留空以隐藏该入口）。
  if (patch.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email)) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  await setFounderContact(patch);
  return NextResponse.json({ ok: true, founderContact: await getFounderContact() });
}
