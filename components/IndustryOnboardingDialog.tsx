"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "./ui/utils";
import { PRESET_TEMPLATES } from "../lib/templates";
import { createSite } from "../lib/site-store";
import { TemplateId, siteEditorPath } from "../lib/constants";

const INDUSTRIES = [
  {
    id: "ecommerce",
    label: "电商零售",
    sublabel: "实体商品 · WhatsApp 下单",
    emoji: "🛍️",
    templateId: TemplateId.EcommerceStarter,
    bg: "from-indigo-500/15 to-purple-600/15",
    border: "border-indigo-500/25",
    hover: "hover:border-indigo-400/60 hover:shadow-indigo-500/15",
  },
  {
    id: "services",
    label: "专业服务",
    sublabel: "咨询 · 代理 · 本地服务",
    emoji: "💼",
    templateId: TemplateId.ServiceBusiness,
    bg: "from-sky-500/15 to-cyan-600/15",
    border: "border-sky-500/25",
    hover: "hover:border-sky-400/60 hover:shadow-sky-500/15",
  },
  {
    id: "crypto",
    label: "加密金融",
    sublabel: "信号群 · 交易社区",
    emoji: "📈",
    templateId: TemplateId.CryptoTrading,
    bg: "from-amber-500/15 to-orange-600/15",
    border: "border-amber-500/25",
    hover: "hover:border-amber-400/60 hover:shadow-amber-500/15",
  },
  {
    id: "health",
    label: "美容健康",
    sublabel: "护肤 · 保健品 · 养生",
    emoji: "🌿",
    templateId: TemplateId.HealthBeauty,
    bg: "from-pink-500/15 to-rose-600/15",
    border: "border-pink-500/25",
    hover: "hover:border-pink-400/60 hover:shadow-pink-500/15",
  },
];

interface Props {
  open: boolean;
  onSkip: () => void;
}

export default function IndustryOnboardingDialog({ open, onSkip }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  function handleSelect(industryId: string) {
    if (loading) return;
    const industry = INDUSTRIES.find(i => i.id === industryId)!;
    setLoading(industryId);

    const template = PRESET_TEMPLATES.find(t => t.id === industry.templateId)!;
    const site = createSite(`我的${industry.label}落地页`, template.id, {
      ...template.data,
      templateId: template.id,
      templateName: `我的${industry.label}落地页`,
    });

    router.push(siteEditorPath(site.id));
  }

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-[calc(100%-2rem)] sm:max-w-md data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 duration-200 outline-none"
          onPointerDownOutside={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">选择您的行业</DialogPrimitive.Title>

          <div className="bg-[#0d0d15] border border-white/[0.07] rounded-2xl p-7 shadow-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] rounded-full px-3 py-1 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-white/40 tracking-wide">账号创建成功</span>
            </div>

            {/* Heading */}
            <h2 className="text-white text-2xl font-semibold leading-tight tracking-tight mb-1.5">
              您主要做哪个行业？
            </h2>
            <p className="text-white/35 text-sm mb-7 leading-relaxed">
              我们将匹配最适合的落地页模板，一键开始构建
            </p>

            {/* Industry Cards */}
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {INDUSTRIES.map((industry, i) => (
                <button
                  key={industry.id}
                  onClick={() => handleSelect(industry.id)}
                  disabled={loading !== null}
                  style={{ animationDelay: `${i * 55}ms` }}
                  className={cn(
                    "relative group text-left rounded-xl border bg-gradient-to-br p-4 transition-all duration-200",
                    "animate-in fade-in-0 slide-in-from-bottom-3 fill-mode-both",
                    "hover:shadow-lg hover:-translate-y-px",
                    industry.bg,
                    industry.border,
                    industry.hover,
                    loading === industry.id && "scale-95 opacity-60",
                    loading !== null && loading !== industry.id && "opacity-30",
                  )}
                >
                  <span className="text-2xl block mb-2.5 leading-none">{industry.emoji}</span>
                  <span className="text-white text-sm font-medium block leading-tight mb-0.5">
                    {industry.label}
                  </span>
                  <span className="text-white/35 text-[11px] block leading-tight">
                    {industry.sublabel}
                  </span>

                  {loading === industry.id && (
                    <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/20">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.06] pt-4 text-center">
              <button
                onClick={onSkip}
                disabled={loading !== null}
                className="text-[11px] text-white/20 hover:text-white/45 transition-colors disabled:pointer-events-none tracking-wide"
              >
                稍后再说，直接进入控制台 →
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
