"use client";
// landing-editor/components/GenerateBriefDialog.tsx
//
// 编辑器内「AI 一键成页」表单：进入编辑器后（?ai=1）默认弹出，填写产品资料后调用
// /api/landing-pages/generate（带 pageId）为当前空白页原地生成文案，成功即把生成的
// LandingPageDraft 灌入编辑器 store（autosave 兜底落库），并清掉 URL 上的 ?ai 标记。
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleSessionExpired } from "@/lib/auth-client";
import { landingEditorPath } from "@/lib/constants";
import type { LandingPageDraft } from "@/types/schema.draft";
import { useEditorDispatch } from "../store/editorStore";
import { useMeta } from "../MetaContext";

/** 生成语言选项；value 直接作为 brief.language 注入 prompt。 */
const LANGUAGES = [
  "English",
  "简体中文",
  "繁體中文",
  "Español",
  "Français",
  "Deutsch",
  "Português",
  "日本語",
  "العربية",
  "Tiếng Việt",
];

export function GenerateBriefDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const dispatch = useEditorDispatch();
  const { pageId } = useMeta();
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    productName: "",
    description: "",
    targetAudience: "",
    tone: "",
    ctaGoal: "",
    language: "English",
    pastedIntro: "",
  });

  /** 关闭并清掉 ?ai 标记，避免刷新再次自动弹出。 */
  function close() {
    setOpen(false);
    router.replace(landingEditorPath(pageId));
  }

  const submit = async () => {
    if (!form.productName || !form.description) {
      toast.error("请填写产品名与介绍");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/landing-pages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, brief: form }),
      });
      if (handleSessionExpired(res, router)) return;
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "ai_quota_exhausted")
          toast.error("AI 额度已用完，请升级或加购 credits");
        else if (data.error === "limit_exceeded")
          toast.error("落地页数量已达套餐上限");
        else toast.error("生成失败，请重试");
        return;
      }
      dispatch({ kind: "replaceDraft", draft: data.draft as LandingPageDraft });
      toast.success("已按你的资料生成文案，可继续在编辑器中调整");
      close();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI 一键成页</DialogTitle>
          <DialogDescription>
            填写产品或公司信息，AI 将依据当前模板为这张落地页自动生成可投放文案。也可直接关闭，手动编辑。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="dis">
            <Label htmlFor="ai-product-name">产品 / 公司名 *</Label>
            <Input
              id="ai-product-name"
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ai-description">它做什么 / 解决什么 *</Label>
            <Textarea
              id="ai-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ai-target-audience">目标客户</Label>
            <Input
              id="ai-target-audience"
              value={form.targetAudience}
              onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ai-tone">语气</Label>
            <Input
              id="ai-tone"
              placeholder="专业 / 亲和 / 紧迫 / 高端"
              value={form.tone}
              onChange={(e) => setForm({ ...form, tone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ai-cta-goal">转化目标</Label>
            <Input
              id="ai-cta-goal"
              placeholder="咨询 / 预约 / 留资 / WhatsApp"
              value={form.ctaGoal}
              onChange={(e) => setForm({ ...form, ctaGoal: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ai-language">生成语言</Label>
            <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
              <SelectTrigger id="ai-language">
                <SelectValue placeholder="选择生成语言" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="ai-pasted-intro">可选：粘贴公司/产品介绍</Label>
            <Textarea
              id="ai-pasted-intro"
              value={form.pastedIntro}
              onChange={(e) => setForm({ ...form, pastedIntro: e.target.value })}
            />
          </div>
          <Button className="w-full" disabled={loading} onClick={submit}>
            {loading ? "AI 生成中…" : "生成文案"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
