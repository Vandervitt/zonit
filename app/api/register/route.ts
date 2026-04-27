import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const { name, email, password, token } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: ApiErrors.FIELDS_REQUIRED }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if email exists
    const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: ApiErrors.EMAIL_IN_USE }, { status: 409 });
    }

    // 2. Process Invitation Token if exists
    let userPlan = 'free';
    let trialExpiresAt = null;
    let invitationId = null;

    if (token) {
      const inviteRes = await client.query(
        "SELECT * FROM invitations WHERE token = $1 AND expires_at > NOW() AND accepted_at IS NULL",
        [token]
      );
      
      const invitation = inviteRes.rows[0];
      if (invitation) {
        userPlan = invitation.plan;
        invitationId = invitation.id;
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + invitation.duration_days);
        trialExpiresAt = expiry;
      }
    }

    // 3. Create User
    const hash = await bcrypt.hash(password, 12);
    const userRes = await client.query(
      "INSERT INTO users (name, email, password_hash, plan, trial_expires_at, invited_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [name, email, hash, userPlan, trialExpiresAt, invitationId ? new Date() : null]
    );

    // 4. Mark invitation as accepted
    if (invitationId) {
      await client.query(
        "UPDATE invitations SET accepted_at = NOW() WHERE id = $1",
        [invitationId]
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    client.release();
  }
}
