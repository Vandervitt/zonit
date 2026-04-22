"use client"

import { useState, useEffect } from "react";
import { Globe, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { LandingPageTemplate } from "@/types/schema";
import { apiSitePath } from "@/lib/constants";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  siteName: string;
  siteData: LandingPageTemplate;
  initialSlug?: string;
  onSuccess: (slug: string) => void;
}

function validateSlug(value: string): string | null {
  if (!value) return "请输入访问地址";
  if (value.length < 3) return "访问地址至少需要 3 个字符";
  if (value.length > 60) return "访问地址不能超过 60 个字符";
  if (!/^[a-z0-9-]+$/.test(value)) return "只能包含小写字母（a-z）、数字（0-9）和连字符（-）";
  if (value.startsWith("-") || value.endsWith("-")) return "不能以连字符（-）开头或结尾";
  if (/--/.test(value)) return "不能包含连续的连字符（--）";
  return null;
}

export function PublishDialog({
  open,
  onOpenChange,
  siteId,
  siteName,
  siteData,
  initialSlug,
  onSuccess,
}: PublishDialogProps) {
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSlug(initialSlug ?? "");
      setError("");
    }
  }, [open, initialSlug]);

  const previewUrl = slug ? `${window.location.origin}/site/${slug}` : "";

  const handleSubmit = async () => {
    const trimmed = slug.trim();
    const validationError = validateSlug(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiSitePath(siteId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: true, slug: trimmed, name: siteName, data: siteData }),
      });

      if (res.status === 409) {
        setError("该地址已被占用，请换一个试试");
        return;
      }
      if (!res.ok) {
        setError("发布失败，请稍后重试");
        return;
      }

      onSuccess(trimmed);
      onOpenChange(false);
    } catch {
      setError("网络异常，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>发布站点</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="slug-input">访问地址</Label>
            <Input
              id="slug-input"
              value={slug}
              onChange={e => {
                setSlug(e.target.value);
                setError("");
              }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="my-landing-page"
              className={error ? "border-red-400 focus-visible:ring-red-400" : ""}
              autoFocus
            />
            {error ? (
              <p className="text-xs text-red-500">{error}</p>
            ) : previewUrl ? (
              <p className="text-xs text-zinc-400 font-mono break-all">{previewUrl}</p>
            ) : (
              <p className="text-xs text-zinc-400">
                只能包含小写字母、数字和连字符，长度 3–60 个字符
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="gap-1.5">
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            发布
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
