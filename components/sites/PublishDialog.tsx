"use client"

import { useState, useEffect } from "react";
import { Globe, Loader2, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LandingPageTemplate } from "@/types/schema";
import { apiSitePath, ApiRoutes } from "@/lib/constants";

interface Domain {
  id: string;
  domain: string;
  verified: boolean;
}

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

function validatePrefix(value: string): string | null {
  if (!value) return null; // Prefix can be empty for root domain
  if (value.length > 60) return "前缀不能超过 60 个字符";
  if (!/^[a-z0-9-]+$/.test(value)) return "只能包含小写字母、数字和连字符";
  if (value.startsWith("-") || value.endsWith("-")) return "不能以连字符开头或结尾";
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
  const [publishType, setPublishType] = useState<"default" | "custom">("default");
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>("");
  const [prefix, setPrefix] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSlug(initialSlug ?? "");
      setError("");
      fetchDomains();
    }
  }, [open, initialSlug]);

  const fetchDomains = async () => {
    try {
      const res = await fetch(ApiRoutes.Domains);
      if (res.ok) {
        const data = await res.json();
        setDomains(data);
        if (data.length > 0) {
          setSelectedDomainId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch domains", err);
    }
  };

  const selectedDomain = domains.find(d => d.id === selectedDomainId);
  const customDomain = selectedDomain 
    ? (prefix ? `${prefix}.${selectedDomain.domain}` : selectedDomain.domain)
    : "";

  const previewUrl = publishType === "default" 
    ? (slug ? `${window.location.origin}/site/${slug}` : "")
    : (customDomain ? `https://${customDomain}` : "");

  const handleSubmit = async () => {
    const trimmedSlug = slug.trim();
    const slugError = validateSlug(trimmedSlug);
    if (slugError) {
      setError(slugError);
      return;
    }

    if (publishType === "custom") {
      if (!selectedDomainId) {
        setError("请选择一个域名");
        return;
      }
      const prefixError = validatePrefix(prefix);
      if (prefixError) {
        setError(prefixError);
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      // 1. Update site status and slug
      const siteRes = await fetch(apiSitePath(siteId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: true, slug: trimmedSlug, name: siteName, data: siteData }),
      });

      if (siteRes.status === 409) {
        setError("该访问地址已被占用，请换一个试试");
        setLoading(false);
        return;
      }
      if (!siteRes.ok) {
        setError("发布失败，请稍后重试");
        setLoading(false);
        return;
      }

      // 2. If custom domain selected, register it
      if (publishType === "custom" && customDomain) {
        const domainRes = await fetch(ApiRoutes.Domains, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: customDomain, siteId }),
        });
        
        if (!domainRes.ok) {
          const domainJson = await domainRes.json();
          if (domainJson.error === "domain_taken") {
            setError("该域名已被其他站点绑定");
          } else {
            setError("绑定自定义域名失败，但站点已发布到默认地址");
          }
          setLoading(false);
          return;
        }
      }

      onSuccess(trimmedSlug);
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
          <DialogDescription>
            发布后，你的站点将可以通过以下地址访问。
          </DialogDescription>
        </DialogHeader>

        <Tabs value={publishType} onValueChange={(v) => setPublishType(v as "default" | "custom")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="default">默认地址</TabsTrigger>
            <TabsTrigger value="custom">自定义域名</TabsTrigger>
          </TabsList>
          
          <TabsContent value="default" className="space-y-4 py-2">
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
              ) : (
                <p className="text-xs text-zinc-400">
                  只能包含小写字母、数字和连字符，长度 3–60 个字符
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 py-2">
            {domains.length === 0 ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-zinc-500">你还没有绑定任何域名</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/domains" target="_blank" rel="noopener noreferrer" className="gap-1.5">
                    去绑定域名 <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 space-y-2">
                    <Label>前缀 (可选)</Label>
                    <Input 
                      placeholder="www" 
                      value={prefix}
                      onChange={e => {
                        setPrefix(e.target.value.toLowerCase());
                        setError("");
                      }}
                    />
                  </div>
                  <div className="col-span-1 text-center pb-2 text-zinc-400">.</div>
                  <div className="col-span-6 space-y-2">
                    <Label>选择域名</Label>
                    <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择域名..." />
                      </SelectTrigger>
                      <SelectContent>
                        {domains.map(d => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.domain}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                {!selectedDomain?.verified && (
                  <div className="flex items-start gap-2 p-2 rounded bg-amber-50 border border-amber-100">
                    <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      该域名尚未验证。发布后可能无法立即访问，请确保已在域名管理中完成 DNS 配置。
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="pt-2">
          <Label className="text-xs text-zinc-500 mb-1.5 block">预览地址</Label>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 break-all font-mono text-xs text-zinc-600">
            {previewUrl || "请输入地址..."}
          </div>
        </div>

        <DialogFooter className="mt-4">
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

