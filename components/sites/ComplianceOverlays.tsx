"use client";

// 合规层：cookie consent banner（底部条）+ age gate（全屏遮罩）。
// MVP：consent 状态写 localStorage（含 policyVersion，policy 升级会重新弹）。
// 不做 IAB TCF v2.2 整合。

import { useEffect, useState } from "react";
import type { ComplianceConfig } from "@/types/schema";

const CONSENT_KEY = "zonit:cookie-consent";
const AGE_KEY = "zonit:age-confirmed";

interface StoredConsent {
  version: string;
  accepted: boolean;
}

export function ComplianceOverlays({ config }: { config: ComplianceConfig }) {
  const cookie = config.cookieConsent;
  const age = config.ageGate;

  const [showCookie, setShowCookie] = useState(false);
  const [showAge, setShowAge] = useState(false);
  const [ageBlocked, setAgeBlocked] = useState(false);

  useEffect(() => {
    if (cookie?.enabled) {
      const raw = localStorage.getItem(CONSENT_KEY);
      const wantedVersion = cookie.policyVersion ?? "v1";
      if (!raw) {
        setShowCookie(true);
      } else {
        try {
          const stored = JSON.parse(raw) as StoredConsent;
          if (stored.version !== wantedVersion) setShowCookie(true);
        } catch {
          setShowCookie(true);
        }
      }
    }
    if (age?.enabled) {
      const confirmed = localStorage.getItem(AGE_KEY) === String(age.minimumAge);
      if (!confirmed) setShowAge(true);
    }
  }, [cookie?.enabled, cookie?.policyVersion, age?.enabled, age?.minimumAge]);

  const acceptCookie = (accepted: boolean) => {
    const payload: StoredConsent = { version: cookie?.policyVersion ?? "v1", accepted };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
    setShowCookie(false);
  };

  const confirmAge = () => {
    if (!age) return;
    localStorage.setItem(AGE_KEY, String(age.minimumAge));
    setShowAge(false);
  };

  const rejectAge = () => {
    if (age?.rejectRedirectUrl) {
      window.location.href = age.rejectRedirectUrl;
      return;
    }
    // 未配回退链接：保留遮罩并切到拒绝态，避免用户继续浏览
    setAgeBlocked(true);
  };

  return (
    <>
      {(showAge || ageBlocked) && age && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-white rounded-2xl p-6 text-center">
            {ageBlocked ? (
              <>
                <p className="text-base text-slate-800 mb-2">Access Restricted</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You must be {age.minimumAge}+ to view this content.
                </p>
              </>
            ) : (
              <>
                <p className="text-base text-slate-800 mb-2">{age.title ?? "Are you of legal age?"}</p>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  {age.description ?? `You must be ${age.minimumAge}+ to access this site.`}
                </p>
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2.5 rounded-full text-sm bg-slate-100 text-slate-700 hover:bg-slate-200"
                    onClick={rejectAge}
                  >
                    {age.rejectText ?? `I'm under ${age.minimumAge}`}
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-full text-sm bg-slate-900 text-white hover:bg-slate-800"
                    onClick={confirmAge}
                  >
                    {age.confirmText ?? `I'm ${age.minimumAge}+`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showCookie && cookie && !showAge && !ageBlocked && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-sm border-t border-slate-200 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800">{cookie.title ?? "We value your privacy"}</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {cookie.description ?? "We use cookies to improve your experience and analyze traffic."}
                {cookie.learnMoreUrl && (
                  <>
                    {" "}
                    <a href={cookie.learnMoreUrl} className="underline">Learn more</a>
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                className="px-3 py-1.5 rounded-full text-xs bg-slate-100 text-slate-700 hover:bg-slate-200"
                onClick={() => acceptCookie(false)}
              >
                {cookie.rejectText ?? "Reject Non-Essential"}
              </button>
              <button
                className="px-3 py-1.5 rounded-full text-xs bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => acceptCookie(true)}
              >
                {cookie.acceptText ?? "Accept All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
