import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
// import PostgresAdapter from "@auth/pg-adapter";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { Routes, UserRole } from "@/lib/constants";
import { isTrustedEmail } from "@/lib/auth/trusted-email";
import { effectivePlan, activeCompPlan, type PlanId } from "@/lib/plans";

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
        if (user.disabled_at) return null; // 已禁用账号：拒绝登录

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    // Dev-only provider: 仅在 NODE_ENV=development 且设置了 DEV_USER_EMAIL 时激活
    ...(process.env.NODE_ENV === "development" && process.env.DEV_USER_EMAIL
      ? [
          Credentials({
            id: "dev",
            name: "Dev Login",
            credentials: {},
            async authorize() {
              const email = process.env.DEV_USER_EMAIL!;
              // 本地联调需要付费功能，dev 一键登录账号固定为 pro 套餐
              const result = await pool.query(
                `INSERT INTO users (email, name, plan)
                 VALUES ($1, 'Dev User', 'pro')
                 ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email, plan = 'pro'
                 RETURNING id, email, name, image`,
                [email],
              );
              const user = result.rows[0];
              return { id: user.id, name: user.name, email: user.email, image: user.image ?? null };
            },
          }),
        ]
      : []),
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
        const existingUser = await pool.query(
          "SELECT id, disabled_at FROM users WHERE email = $1",
          [user.email]
        );
        if (existingUser.rows.length > 0) {
          if (existingUser.rows[0].disabled_at) {
            console.warn("SignIn failed: account disabled", user.email);
            return false;
          }
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
            "SELECT email, plan, comp_plan, comp_plan_expires_at, role, trial_expires_at, disabled_at FROM users WHERE id = $1",
            [userId]
          );
          const userData = r.rows[0];

          if (userData) {
            if (userData.disabled_at) {
              // 已禁用：清空会话权益与角色；API 侧由 getUserPlanOrNull → session_stale 兜底
              token.plan = "free" as PlanId;
              token.role = UserRole.USER;
              return token;
            }
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

            const comp = activeCompPlan(userData.comp_plan ?? null, userData.comp_plan_expires_at, new Date());
            token.plan = effectivePlan(currentPlan as PlanId, comp);
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
