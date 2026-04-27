"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Grid2x2, TicketCheck } from "lucide-react";
import IndustryOnboardingDialog from "@/components/IndustryOnboardingDialog";
import { Routes, ApiRoutes, AuthProvider } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isInvited, setIsInvited] = useState(false);

  // 如果有 token，可以尝试在挂载时进行一些视觉反馈或预校验（可选）
  useEffect(() => {
    if (token) {
      setIsInvited(true);
      // 注意：这里可以增加一个 API 来通过 token 预取用户邮箱，提高体验
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch(ApiRoutes.Register, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name, 
        email, 
        password,
        token // 将邀请 token 传给后端
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed.");
      setLoading(false);
      return;
    }

    await signIn(AuthProvider.Credentials, { email, password, redirect: false });
    setLoading(false);
    setShowOnboarding(true);
  }

  return (
    <div className="w-full max-w-sm bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center">
          <Grid2x2 className="w-4 h-4 text-white" />
        </div>
        <span className="text-slate-800 tracking-widest text-sm uppercase">PULSAR</span>
      </div>

      <h1 className="text-2xl text-slate-800 mb-1">Create account</h1>
      <p className="text-sm text-slate-400 mb-4">Sign up to get started</p>

      {isInvited && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl mb-6">
          <TicketCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs text-emerald-700 font-medium">专属邀请权益已应用</span>
        </div>
      )}

      <button
        onClick={() => signIn(AuthProvider.Google, { callbackUrl: Routes.Home })}
        className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors mb-4"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-rose-400 transition-colors"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-rose-400 transition-colors"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-rose-400 transition-colors"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-xs text-slate-400 text-center mt-5">
        Already have an account?{" "}
        <Link href={Routes.Login} className="text-rose-500 hover:underline">
          Sign in
        </Link>
      </p>

      <IndustryOnboardingDialog
        open={showOnboarding}
        onSkip={() => { router.push(Routes.Home); router.refresh(); }}
      />
    </div>
  );
}
