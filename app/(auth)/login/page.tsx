"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Grid2x2 } from "lucide-react";
import { Routes, AuthProvider } from "@/lib/constants";
import { useMutation } from "@/lib/api/use-mutation";
import { ApiError } from "@/lib/api/fetcher";
import { OtpAuthForm } from "@/components/auth/OtpAuthForm";

// 本地 dev 默认占位账密：配合 `pnpm db:seed-dev` 种入的 admin 用户，一键登录联调
const DEV_EMAIL = process.env.NODE_ENV === "development" ? "admin@zapbridge.com" : "";
const DEV_PASSWORD = process.env.NODE_ENV === "development" ? "Password1!" : "";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEV_EMAIL);
  const [password, setPassword] = useState(DEV_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<AuthProvider | null>(null);

  const oauthSignIn = useMutation(
    (provider: AuthProvider) => signIn(provider, { callbackUrl: Routes.Dashboard }),
  );

  const devSignIn = useMutation(
    async () => {
      const res = await signIn(AuthProvider.Dev, { redirect: false });
      if (res?.error) throw new ApiError(401, "Dev login failed.");
      return res;
    },
    { onSuccess: () => { router.push(Routes.Dashboard); router.refresh(); } },
  );

  const credentialsSignIn = useMutation(
    async (args: { email: string; password: string }) => {
      const res = await signIn(AuthProvider.Credentials, { ...args, redirect: false });
      if (res?.error) throw new ApiError(401, "Invalid email or password.");
      return res;
    },
    {
      errorToast: false,
      onSuccess: () => { router.push(Routes.Dashboard); router.refresh(); },
    },
  );

  async function handleOAuthSignIn(provider: AuthProvider) {
    setOauthProvider(provider);
    await oauthSignIn.trigger(provider);
    setOauthProvider(null);
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    void credentialsSignIn.trigger({ email, password });
  }

  const passwordError = credentialsSignIn.error?.message;
  const passwordLoading = credentialsSignIn.isMutating;
  const oauthLoading = oauthProvider;

  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl shadow-aqua-500/10 border border-aqua-100 p-8">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-aqua-500 to-tech flex items-center justify-center shadow-sm shadow-aqua-500/30">
          <Grid2x2 className="w-4 h-4 text-white" />
        </div>
        <span className="text-foreground tracking-widest text-sm uppercase">Zap Bridge</span>
      </div>

      <h1 className="text-2xl text-foreground mb-1">欢迎回来</h1>
      <p className="text-sm text-muted-foreground mb-6">输入邮箱获取验证码即可登录</p>

      <div className="flex flex-col gap-3 mb-6">
        <button
          onClick={() => handleOAuthSignIn(AuthProvider.Google)}
          disabled={!!oauthLoading}
          className="w-full flex items-center justify-center gap-3 border border-aqua-200 rounded-xl py-2.5 text-sm text-foreground/80 hover:bg-aqua-50 hover:border-aqua-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {oauthLoading === AuthProvider.Google ? (
            <div className="w-4 h-4 border-2 border-aqua-200 border-t-aqua-500 rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {oauthLoading === AuthProvider.Google ? "连接中…" : "Google 登录"}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-aqua-100" />
        <span className="text-xs text-muted-foreground italic">或使用邮箱验证码</span>
        <div className="flex-1 h-px bg-aqua-100" />
      </div>

      <OtpAuthForm />

      <p className="text-xs text-muted-foreground text-center mt-5">
        还没有账号？{" "}
        <Link href={Routes.Register} className="text-aqua-600 font-medium hover:underline">
          注册
        </Link>
      </p>

      {/* 老用户密码登录兜底：默认折叠，不主推。 */}
      <div className="mt-5 pt-4 border-t border-dashed border-aqua-100">
        {!showPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword(true)}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            用密码登录（老用户）
          </button>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
            <label htmlFor="pw-email" className="sr-only">邮箱</label>
            <input
              id="pw-email"
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2.5 rounded-xl border border-aqua-200 bg-white/60 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-aqua-400 focus:ring-2 focus:ring-aqua-200 transition-colors"
            />
            <label htmlFor="pw-password" className="sr-only">密码</label>
            <input
              id="pw-password"
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-2.5 rounded-xl border border-aqua-200 bg-white/60 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-aqua-400 focus:ring-2 focus:ring-aqua-200 transition-colors"
            />
            {passwordError && <p className="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded-lg">{passwordError}</p>}
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2.5 rounded-xl border border-aqua-300 text-sm font-medium text-foreground/80 hover:bg-aqua-50 transition-colors disabled:opacity-60"
            >
              {passwordLoading ? "验证中…" : "密码登录"}
            </button>
          </form>
        )}
      </div>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 pt-4 border-t border-dashed border-aqua-100">
          <button
            type="button"
            onClick={() => void devSignIn.trigger()}
            disabled={devSignIn.isMutating}
            className="w-full py-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            {devSignIn.isMutating ? "登录中…" : "⚡ Dev 登录（仅本地）"}
          </button>
        </div>
      )}
    </div>
  );
}
