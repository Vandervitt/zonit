import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
// import PostgresAdapter from "@auth/pg-adapter";
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

// Debug configuration
if (!process.env.AUTH_SECRET) {
  console.warn("Missing AUTH_SECRET environment variable");
}
if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) {
  console.warn("Missing Google OAuth environment variables (AUTH_GOOGLE_ID/SECRET)");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: true,
  // adapter: PostgresAdapter(pool),
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
    }),
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      tenantId: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID,
    }),
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
      console.log("SignIn callback triggered", { email: user?.email, provider: account?.provider });
      if (!user?.email) {
        console.warn("SignIn failed: No email provided by provider");
        return false;
      }
      
      try {
        // 检查用户是否已经是系统内用户（针对受邀用户）
        const existingUser = await pool.query("SELECT id, invited_at FROM users WHERE email = $1", [user.email]);
        if (existingUser.rows.length > 0) {
          user.id = existingUser.rows[0].id;
          console.log("SignIn success: Existing user found");
          return true; // 已存在用户（包括受邀注册后的）允许登录
        }

        // 核心拦截逻辑：针对新用户 OAuth 登录进行域名检查
        if (!isTrustedEmail(user.email)) {
          console.warn("SignIn failed: Email domain not trusted", user.email);
          return false;
        }

        // 新用户：写入 users 表并以本地 ID 覆盖 user.id，确保 JWT/Session 用本地 ID
        const inserted = await pool.query(
          "INSERT INTO users (email, name, image) VALUES ($1, $2, $3) RETURNING id",
          [user.email, user.name ?? null, user.image ?? null]
        );
        user.id = inserted.rows[0].id;
        console.log("SignIn success: New trusted user created", user.id);
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      try {
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
      } catch (error) {
        console.error("JWT callback error:", error);
        return token;
      }
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.plan = token.plan as PlanId;
      session.user.role = token.role as UserRole;
      return session;
    },
  },
});
