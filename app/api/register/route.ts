import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: ApiErrors.FIELDS_REQUIRED }, { status: 400 });
  }

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: ApiErrors.EMAIL_IN_USE }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)",
    [name, email, hash]
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
