"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Grid2x2 } from "lucide-react";
import { Routes, AuthProvider } from "@/lib/constants";
import { useMutation } from "@/lib/api/use-mutation";
import { ApiError } from "@/lib/api/fetcher";

// 本地 dev 默认占位账密：配合 `pnpm db:seed-dev` 种入的 admin 用户，一键登录联调
const DEV_EMAIL = process.env.NODE_ENV === "development" ? "admin@zapbridge.com" : "";
const DEV_PASSWORD = process.env.NODE_ENV === "development" ? "Password1!" : "";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEV_EMAIL);
  const [password, setPassword] = useState(DEV_PASSWORD);
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void credentialsSignIn.trigger({ email, password });
  }

  const error = credentialsSignIn.error?.message;
  const loading = credentialsSignIn.isMutating;
  const oauthLoading = oauthProvider;

  return (
    <div className="w-full max-w-sm bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl shadow-aqua-500/10 border border-aqua-100 p-8">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-aqua-500 to-tech flex items-center justify-center shadow-sm shadow-aqua-500/30">
          <Grid2x2 className="w-4 h-4 text-white" />
        </div>
        <span className="text-foreground tracking-widest text-sm uppercase">Zap Bridge</span>
      </div>

      <h1 className="text-2xl text-foreground mb-1">Welcome back</h1>
      <p className="text-sm text-muted-foreground mb-6">Sign in with your trusted account</p>

      <div className="flex flex-col gap-3 mb-6">
        <button
          onClick={() => handleOAuthSignIn(AuthProvider.Google)}
          disabled={!!oauthLoading || loading}
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
          {oauthLoading === AuthProvider.Google ? "Connecting..." : "Google"}
        </button>

        <button
          onClick={() => handleOAuthSignIn(AuthProvider.Microsoft)}
          disabled={!!oauthLoading || loading}
          className="w-full flex items-center justify-center gap-3 border border-aqua-200 rounded-xl py-2.5 text-sm text-foreground/80 hover:bg-aqua-50 hover:border-aqua-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {oauthLoading === AuthProvider.Microsoft ? (
            <div className="w-4 h-4 border-2 border-aqua-200 border-t-aqua-500 rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 23 23">
              <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
          )}
          {oauthLoading === AuthProvider.Microsoft ? "Connecting..." : "Microsoft"}
        </button>

        <button
          onClick={() => handleOAuthSignIn(AuthProvider.Apple)}
          disabled={!!oauthLoading || loading}
          className="w-full flex items-center justify-center gap-3 border border-aqua-200 rounded-xl py-2.5 text-sm text-foreground/80 hover:bg-aqua-50 hover:border-aqua-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {oauthLoading === AuthProvider.Apple ? (
            <div className="w-4 h-4 border-2 border-aqua-200 border-t-aqua-500 rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 384 512">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </svg>
          )}
          {oauthLoading === AuthProvider.Apple ? "Connecting..." : "Apple"}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-aqua-100" />
        <span className="text-xs text-muted-foreground italic">or use email</span>
        <div className="flex-1 h-px bg-aqua-100" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <input
            type="email"
            placeholder="Work or Personal Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-aqua-200 bg-white/60 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-aqua-400 focus:ring-2 focus:ring-aqua-200 transition-colors"
          />
          <p className="mt-1.5 text-[10px] text-muted-foreground px-1">
            * Only Gmail, Outlook, or iCloud supported
          </p>
        </div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-aqua-200 bg-white/60 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-aqua-400 focus:ring-2 focus:ring-aqua-200 transition-colors"
        />
        {error && <p className="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded-lg">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-aqua-500 to-tech text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-aqua-500/30"
        >
          {loading ? "Verifying…" : "Sign in with Email"}
        </button>
      </form>

      <p className="text-xs text-muted-foreground text-center mt-5">
        No account?{" "}
        <Link href={Routes.Register} className="text-aqua-600 font-medium hover:underline">
          Sign up
        </Link>
      </p>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 pt-4 border-t border-dashed border-aqua-100">
          <button
            type="button"
            onClick={() => void devSignIn.trigger()}
            disabled={devSignIn.isMutating}
            className="w-full py-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            {devSignIn.isMutating ? "Logging in…" : "⚡ Dev Login (local only)"}
          </button>
        </div>
      )}
    </div>
  );
}
