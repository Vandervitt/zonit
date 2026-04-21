import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import PostgresAdapter from "@auth/pg-adapter";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { Routes } from "@/lib/constants";
import type { PlanId } from "@/lib/plans";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  session: { strategy: "jwt" },
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const result = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [credentials.email]
        );
        const user = result.rows[0];
        if (!user?.password_hash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  pages: {
    signIn: Routes.Login,
  },
  callbacks: {
    async jwt({ token, user }) {
      const userId = user?.id ?? token.sub;
      if (userId) {
        const r = await pool.query("SELECT plan FROM users WHERE id = $1", [userId]);
        token.plan = (r.rows[0]?.plan ?? "free") as PlanId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.plan = token.plan as PlanId;
      return session;
    },
  },
});
