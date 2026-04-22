"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiRoutes } from "@/lib/constants";

interface Site {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sites: Site[];
  onAdded: () => void;
}

export function AddDomainDialog({ open, onOpenChange, sites, onAdded }: Props) {
  const [domain, setDomain] = useState("");
  const [siteId, setSiteId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cname, setCname] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setDomain("");
    setSiteId("");
    setError("");
    setCname(null);
    setCopied(false);
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(ApiRoutes.Domains, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, siteId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          json.error === "invalid_domain" ? "域名格式不正确" :
          json.error === "domain_taken" ? "该域名已被其他账号绑定" :
          json.error === "vercel_api_error" ? "Vercel API 调用失败，请稍后重试" :
          "添加失败，请重试"
        );
        return;
      }
      setCname(json.cname);
      onAdded();
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!cname) return;
    navigator.clipboard.writeText(cname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>添加自定义域名</DialogTitle>
          <DialogDescription>
            绑定你自己的域名，用户访问时地址栏显示你的品牌域名。
          </DialogDescription>
        </DialogHeader>

        {!cname ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>域名</Label>
              <Input
                placeholder="example.com 或 www.example.com"
                value={domain}
                onChange={e => setDomain(e.target.value.trim().toLowerCase())}
              />
            </div>
            <div className="space-y-1.5">
              <Label>绑定到站点</Label>
              <Select value={siteId} onValueChange={setSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择站点…" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              className="w-full"
              disabled={!domain || !siteId || loading}
              onClick={handleSubmit}
            >
              {loading ? "添加中…" : "添加域名"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              域名已添加。请前往你的 DNS 服务商（Cloudflare）添加以下 CNAME 记录，Vercel 将在 DNS 生效后自动签发 SSL 证书。
            </p>
            <div className="rounded-lg border bg-slate-50 p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">类型</p>
                <p className="text-sm font-mono">CNAME</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">名称</p>
                <p className="text-sm font-mono">{domain.startsWith("www.") ? "www" : domain}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">值</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono flex-1">{cname}</p>
                  <button onClick={handleCopy} className="text-slate-400 hover:text-slate-600">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ 如使用 Cloudflare，顶级域名（如 example.com）请将代理状态设为「仅 DNS」（灰色云朵），子域名（如 www.example.com）则无此限制。
            </p>
            <Button className="w-full" onClick={() => { reset(); onOpenChange(false); }}>
              完成
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
