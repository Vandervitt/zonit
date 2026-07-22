"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Grid2x2, TicketCheck } from "lucide-react";
import { Routes, ApiRoutes, AuthProvider } from "@/lib/constants";
import { withLogger } from "@/lib/logger";
import { jsonRequest } from "@/lib/api/fetcher";
import { useMutation } from "@/lib/api/use-mutation";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const isInvited = Boolean(token);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const googleSignIn = useMutation(
    () => withLogger("GOOGLE_SIGN_IN", "auth/google", "POST", {}, () =>
      signIn(AuthProvider.Google, { callbackUrl: Routes.Home }),
    ),
  );

  // 行内显示错误（不弹 toast）：从 ApiError.message 拿后端 error 字段
  const register = useMutation(
    async (payload: { name: string; email: string; password: string; token: string | null }) => {
      await withLogger("USER_REGISTRATION", ApiRoutes.Register, "POST", payload, () =>
        jsonRequest(ApiRoutes.Register, "POST", payload),
      );
      await withLogger("CREDENTIALS_SIGN_IN", "auth/credentials", "POST", { email: payload.email }, () =>
        signIn(AuthProvider.Credentials, { email: payload.email, password: payload.password, redirect: false }),
      );
    },
    {
      errorToast: false,
      onSuccess: () => { router.push(Routes.Home); router.refresh(); },
    },
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void register.trigger({ name, email, password, token });
  }

  const error = register.error?.message;
  const loading = register.isMutating;
  const googleLoading = googleSignIn.isMutating;

  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl shadow-aqua-500/10 border border-aqua-100 p-8">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-aqua-500 to-tech flex items-center justify-center shadow-sm shadow-aqua-500/30">
          <Grid2x2 className="w-4 h-4 text-white" />
        </div>
        <span className="text-foreground tracking-widest text-sm uppercase">Zap Bridge</span>
      </div>

      <h1 className="text-2xl text-foreground mb-1">创建账号</h1>
      <p className="text-sm text-muted-foreground mb-4">注册后即可开始使用</p>

      {isInvited && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl mb-6">
          <TicketCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs text-emerald-700 font-medium">专属邀请权益已应用</span>
        </div>
      )}

      <button
        onClick={() => void googleSignIn.trigger()}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 border border-aqua-200 rounded-xl py-2.5 text-sm text-foreground/80 hover:bg-aqua-50 hover:border-aqua-300 transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {googleLoading ? (
          <div className="w-4 h-4 border-2 border-aqua-200 border-t-aqua-500 rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        {googleLoading ? "连接中…" : "使用 Google 继续"}
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-aqua-100" />
        <span className="text-xs text-muted-foreground">或</span>
        <div className="flex-1 h-px bg-aqua-100" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="姓名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-aqua-200 bg-white/60 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-aqua-400 focus:ring-2 focus:ring-aqua-200 transition-colors"
        />
        <div>
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-aqua-200 bg-white/60 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-aqua-400 focus:ring-2 focus:ring-aqua-200 transition-colors"
          />
          <p className="mt-1.5 text-[10px] text-muted-foreground px-1">
            * 仅支持 Gmail 邮箱
          </p>
        </div>
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-2.5 rounded-xl border border-aqua-200 bg-white/60 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-aqua-400 focus:ring-2 focus:ring-aqua-200 transition-colors"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-aqua-500 to-tech text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-aqua-500/30"
        >
          {loading ? "创建中…" : "创建账号"}
        </button>
      </form>

      <p className="text-xs text-muted-foreground text-center mt-5">
        已有账号？{" "}
        <Link href={Routes.Login} className="text-aqua-600 font-medium hover:underline">
          登录
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8" />}>
      <RegisterPageContent />
    </Suspense>
  );
}
