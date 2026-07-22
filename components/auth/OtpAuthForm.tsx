"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthProvider, Routes, ApiRoutes } from "@/lib/constants";
import { jsonRequest, ApiError } from "@/lib/api/fetcher";
import { useMutation } from "@/lib/api/use-mutation";

const RESEND_COOLDOWN_SECONDS = 60;

type SendResponse = { ok: true; devCode?: string };

/**
 * 邮箱验证码免密登录/注册表单（登录、注册页共用）。
 * 阶段一：输入邮箱 → 发送验证码；阶段二：输入 6 位验证码 → 登录/注册（find-or-create）。
 * 支持可选邀请 token（新用户套用权益）。
 */
export function OtpAuthForm({ token }: { token?: string | null }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendCode = useMutation(
    (targetEmail: string) =>
      jsonRequest<SendResponse>(ApiRoutes.OtpSend, "POST", { email: targetEmail }),
    {
      errorToast: false,
      onSuccess: (data) => {
        setPhase("code");
        setCooldown(RESEND_COOLDOWN_SECONDS);
        // dev 环境后端回传验证码，自动回填便于本地联调与 E2E。
        if (data?.devCode) setCode(data.devCode);
      },
    },
  );

  const verify = useMutation(
    async (args: { email: string; code: string }) => {
      const res = await signIn(AuthProvider.EmailOtp, {
        email: args.email,
        code: args.code,
        token: token ?? undefined,
        redirect: false,
      });
      if (res?.error) throw new ApiError(401, "验证码错误或已过期，请重试。");
      return res;
    },
    {
      errorToast: false,
      onSuccess: () => {
        router.push(Routes.Dashboard);
        router.refresh();
      },
    },
  );

  function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    void sendCode.trigger(email.trim());
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    void verify.trigger({ email: email.trim(), code: code.trim() });
  }

  const sendError = sendCode.error?.message;
  const verifyError = verify.error?.message;

  if (phase === "email") {
    return (
      <form onSubmit={handleSendCode} className="flex flex-col gap-3">
        <label htmlFor="otp-email" className="sr-only">
          邮箱
        </label>
        <input
          id="otp-email"
          type="email"
          placeholder="你的邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full px-4 py-2.5 rounded-xl border border-aqua-200 bg-white/60 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-aqua-400 focus:ring-2 focus:ring-aqua-200 transition-colors"
        />
        <p className="text-[10px] text-muted-foreground px-1">
          * 支持任意邮箱，我们会发送一个 6 位验证码
        </p>
        {sendError && (
          <p className="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded-lg">
            {sendError}
          </p>
        )}
        <button
          type="submit"
          disabled={sendCode.isMutating}
          className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-aqua-500 to-tech text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-aqua-500/30"
        >
          {sendCode.isMutating ? "发送中…" : "发送验证码"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground px-1">
        验证码已发送至 <span className="font-medium text-foreground">{email.trim()}</span>
      </p>
      <label htmlFor="otp-code" className="sr-only">
        验证码
      </label>
      <input
        id="otp-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        placeholder="6 位验证码"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        required
        className="w-full px-4 py-2.5 rounded-xl border border-aqua-200 bg-white/60 text-sm tracking-[0.5em] text-center text-foreground placeholder-muted-foreground outline-none focus:border-aqua-400 focus:ring-2 focus:ring-aqua-200 transition-colors"
      />
      {verifyError && (
        <p className="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded-lg">
          {verifyError}
        </p>
      )}
      <button
        type="submit"
        disabled={verify.isMutating || code.length !== 6}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-aqua-500 to-tech text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-aqua-500/30"
      >
        {verify.isMutating ? "验证中…" : "登录 / 注册"}
      </button>
      <div className="flex items-center justify-between text-xs px-1">
        <button
          type="button"
          onClick={() => {
            setPhase("email");
            setCode("");
            verify.reset();
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 换个邮箱
        </button>
        <button
          type="button"
          disabled={cooldown > 0 || sendCode.isMutating}
          onClick={() => void sendCode.trigger(email.trim())}
          className="text-aqua-600 font-medium hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `重新发送（${cooldown}s）` : "重新发送"}
        </button>
      </div>
    </form>
  );
}
