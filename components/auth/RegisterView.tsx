"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { TicketCheck } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Routes, AuthProvider } from "@/lib/constants";
import { withLogger } from "@/lib/logger";
import { useMutation } from "@/lib/api/use-mutation";
import { OtpAuthForm } from "@/components/auth/OtpAuthForm";
import { GoogleMark } from "@/components/auth/GoogleMark";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";

function RegisterContent({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).auth.register;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const isInvited = Boolean(token);

  const googleSignIn = useMutation(
    () => withLogger("GOOGLE_SIGN_IN", "auth/google", "POST", {}, () =>
      signIn(AuthProvider.Google, { callbackUrl: Routes.Home }),
    ),
  );
  const googleLoading = googleSignIn.isMutating;

  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl shadow-aqua-500/10 border border-aqua-100 p-8">
      <div className="flex items-center gap-2 mb-8">
        <BrandMark className="w-7 h-7 rounded-lg shadow-sm shadow-aqua-500/30" />
        <span className="text-foreground tracking-widest text-sm uppercase">Zap Bridge</span>
      </div>

      <h1 className="text-2xl text-foreground mb-1">{t.title}</h1>
      <p className="text-sm text-muted-foreground mb-4">{t.subtitle}</p>

      {isInvited && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl mb-6">
          <TicketCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs text-emerald-700 font-medium">{t.invited}</span>
        </div>
      )}

      <button
        onClick={() => void googleSignIn.trigger()}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 border border-aqua-200 rounded-xl py-2.5 text-sm text-foreground/80 hover:bg-aqua-50 hover:border-aqua-300 transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {googleLoading ? (
          <div className="w-4 h-4 border-2 border-aqua-200 border-t-aqua-500 rounded-full animate-spin" />
        ) : (
          <GoogleMark />
        )}
        {googleLoading ? t.googleLoading : t.google}
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-aqua-100" />
        <span className="text-xs text-muted-foreground">{t.divider}</span>
        <div className="flex-1 h-px bg-aqua-100" />
      </div>

      <OtpAuthForm locale={locale} token={token} />

      <p className="text-xs text-muted-foreground text-center mt-5">
        {t.hasAccount}{" "}
        <Link href={localePath(locale, Routes.Login)} className="text-aqua-600 font-medium hover:underline">
          {t.loginLink}
        </Link>
      </p>
    </div>
  );
}

export function RegisterView({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={<div className="w-full max-w-sm bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8" />}>
      <RegisterContent locale={locale} />
    </Suspense>
  );
}
