import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import PostgresAdapter from "@auth/pg-adapter";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { Routes, UserRole } from "@/lib/constants";
import type { PlanId } from "@/lib/plans";

const TRUSTED_DOMAINS = [
  "gmail.com", "googlemail.com",
  "outlook.com", "hotmail.com", "live.com", "msn.com",
  "icloud.com", "me.com", "mac.com"
];

const isTrustedEmail = (email?: string | null) => {
  if (!email) return false;
  const domain = email.toLowerCase().split("@")[1];
  return TRUSTED_DOMAINS.includes(domain);
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  session: { strategy: "jwt" },
  providers: [
    Google,
    Apple,
    MicrosoftEntraID,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // 限制 Credentials 登录也必须是信任的域名
        if (!isTrustedEmail(credentials.email as string)) return null;

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
    async signIn({ user, account }) {
      // 检查用户是否已经是系统内用户（针对受邀用户）
      const existingUser = await pool.query("SELECT id, invited_at FROM users WHERE email = $1", [user.email]);
      if (existingUser.rows.length > 0) {
        return true; // 已存在用户（包括受邀注册后的）允许登录
      }

      // 核心拦截逻辑：针对新用户 OAuth 登录进行域名检查
      if (!isTrustedEmail(user.email)) {
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      const userId = user?.id ?? token.sub;
      if (userId) {
        const r = await pool.query(
          "SELECT email, plan, role, trial_expires_at FROM users WHERE id = $1", 
          [userId]
        );
        const userData = r.rows[0];
        
        if (userData) {
          const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim());
          const isHardwareAdmin = adminEmails.includes(userData.email);

          // 处理试用期过期
          let currentPlan = userData.plan ?? "free";
          if (userData.trial_expires_at && new Date(userData.trial_expires_at) < new Date()) {
            if (currentPlan !== "free" && !isHardwareAdmin) {
              await pool.query(
                "UPDATE users SET plan = 'free', trial_expires_at = NULL WHERE id = $1",
                [userId]
              );
              currentPlan = "free";
            }
          }

          // 物理同步：如果环境变量里有，但数据库里还没改，则执行更新
          if (isHardwareAdmin && userData.role !== UserRole.SUPER_ADMIN) {
            await pool.query(
              "UPDATE users SET role = $1, plan = $2 WHERE id = $3", 
              [UserRole.SUPER_ADMIN, "agency", userId]
            );
            currentPlan = "agency";
          }

          token.plan = currentPlan as PlanId;
          token.role = (isHardwareAdmin ? UserRole.SUPER_ADMIN : (userData.role ?? UserRole.USER)) as UserRole;
        }
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.plan = token.plan as PlanId;
      session.user.role = token.role as UserRole;
      return session;
    },
  },
});
