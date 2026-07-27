"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { Routes, AuthProvider } from "@/lib/constants";
import { useMutation } from "@/lib/api/use-mutation";
import { ApiError } from "@/lib/api/fetcher";
import { OtpAuthForm } from "@/components/auth/OtpAuthForm";
import { GoogleMark } from "@/components/auth/GoogleMark";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";

export function LoginView({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).auth.login;
  const router = useRouter();
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

  async function handleOAuthSignIn(provider: AuthProvider) {
    setOauthProvider(provider);
    await oauthSignIn.trigger(provider);
    setOauthProvider(null);
  }

  const oauthLoading = oauthProvider;

  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl shadow-aqua-500/10 border border-aqua-100 p-8">
      <div className="flex items-center gap-2 mb-8">
        <BrandMark className="w-7 h-7 rounded-lg shadow-sm shadow-aqua-500/30" />
        <span className="text-foreground tracking-widest text-sm uppercase">Zap Bridge</span>
      </div>

      <h1 className="text-2xl text-foreground mb-1">{t.title}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t.subtitle}</p>

      <div className="flex flex-col gap-3 mb-6">
        <button
          onClick={() => handleOAuthSignIn(AuthProvider.Google)}
          disabled={!!oauthLoading}
          className="w-full flex items-center justify-center gap-3 border border-aqua-200 rounded-xl py-2.5 text-sm text-foreground/80 hover:bg-aqua-50 hover:border-aqua-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {oauthLoading === AuthProvider.Google ? (
            <div className="w-4 h-4 border-2 border-aqua-200 border-t-aqua-500 rounded-full animate-spin" />
          ) : (
            <GoogleMark />
          )}
          {oauthLoading === AuthProvider.Google ? t.googleLoading : t.google}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-aqua-100" />
        <span className="text-xs text-muted-foreground italic">{t.divider}</span>
        <div className="flex-1 h-px bg-aqua-100" />
      </div>

      <OtpAuthForm locale={locale} />

      <p className="text-xs text-muted-foreground text-center mt-5">
        {t.noAccount}{" "}
        <Link href={localePath(locale, Routes.Register)} className="text-aqua-600 font-medium hover:underline">
          {t.registerLink}
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
            {devSignIn.isMutating ? t.devLoading : t.devButton}
          </button>
        </div>
      )}
    </div>
  );
}
