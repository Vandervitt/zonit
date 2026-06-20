"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { landingEditorPath } from "@/lib/constants";

export function GeneratePageDialog({
  templateId,
  children,
}: {
  templateId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    productName: "",
    description: "",
    targetAudience: "",
    tone: "",
    ctaGoal: "",
    pastedIntro: "",
  });

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
        body: JSON.stringify({ templateId, brief: form }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "ai_quota_exhausted")
          toast.error("AI 额度已用完，请升级或加购 credits");
        else if (data.error === "limit_exceeded")
          toast.error("落地页数量已达套餐上限");
        else toast.error("生成失败，请重试");
        return;
      }
      toast.success("已生成，正在打开编辑器");
      router.push(landingEditorPath(data.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>用 AI 填充这套模板</DialogTitle>
          <DialogDescription>
            填写产品或公司信息，AI 将依据所选模板自动生成可投放的落地页文案。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="ai-product-name">产品 / 公司名 *</Label>
            <Input
              id="ai-product-name"
              value={form.productName}
              onChange={(e) =>
                setForm({ ...form, productName: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="ai-description">它做什么 / 解决什么 *</Label>
            <Textarea
              id="ai-description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="ai-target-audience">目标客户</Label>
            <Input
              id="ai-target-audience"
              value={form.targetAudience}
              onChange={(e) =>
                setForm({ ...form, targetAudience: e.target.value })
              }
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
            <Label htmlFor="ai-pasted-intro">可选：粘贴公司/产品介绍</Label>
            <Textarea
              id="ai-pasted-intro"
              value={form.pastedIntro}
              onChange={(e) =>
                setForm({ ...form, pastedIntro: e.target.value })
              }
            />
          </div>
          <Button
            className="w-full"
            disabled={loading}
            onClick={submit}
          >
            {loading ? "AI 生成中…" : "生成落地页"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
