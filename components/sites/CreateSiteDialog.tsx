import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";
import { useTemplates } from "../../lib/use-templates";
import { createSite, isSiteNameUnique } from "../../lib/site-store";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (siteId: string) => void;
}

export function CreateSiteDialog({ open, onOpenChange, onCreated }: Props) {
  const { templates, loading } = useTemplates();
  const [selectedId, setSelectedId] = useState<string>("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedId && templates.length > 0) {
      setSelectedId(templates[0].id);
    }
  }, [templates, selectedId]);

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("站点名称不能为空");
      return;
    }
    if (trimmed.length < 2) {
      setError("站点名称至少需要 2 个字符");
      return;
    }
    if (!isSiteNameUnique(trimmed)) {
      setError("该站点名称已存在，请换一个");
      return;
    }
    const template = templates.find(t => t.id === selectedId);
    if (!template) {
      setError("请选择一个模板");
      return;
    }
    const site = createSite(trimmed, selectedId, {
      ...template.data,
      templateId: selectedId,
      templateName: trimmed,
    });
    setName("");
    setError("");
    setSelectedId(templates[0]?.id ?? "");
    onCreated(site.id);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setName("");
      setError("");
      setSelectedId(templates[0]?.id ?? "");
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>新建站点</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Template Selection */}
          <div>
            <Label className="text-sm mb-3 block">选择模板</Label>
            {loading ? (
              <p className="text-xs text-muted-foreground py-4">模板加载中...</p>
            ) : templates.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">暂无可用模板，请联系管理员上传</p>
            ) : (
            <div className="grid grid-cols-2 gap-3">
              {templates.map(tpl => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedId(tpl.id)}
                  className={cn(
                    "relative rounded-xl border-2 overflow-hidden text-left transition-all hover:shadow-md",
                    selectedId === tpl.id
                      ? "border-primary shadow-sm"
                      : "border-transparent hover:border-border",
                  )}
                >
                  {/* Gradient Preview */}
                  <div className={`h-20 bg-gradient-to-br ${tpl.gradient} relative`}>
                    {selectedId === tpl.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-3">
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 bg-white/20 text-white border-white/30"
                      >
                        {tpl.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 bg-white">
                    <p className="text-sm text-slate-800">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tpl.description}</p>
                  </div>
                </button>
              ))}
            </div>
            )}
          </div>

          {/* Site Name */}
          <div>
            <Label htmlFor="site-name" className="text-sm mb-2 block">
              站点名称
            </Label>
            <Input
              id="site-name"
              placeholder="例如：我的产品落地页"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={e => e.key === "Enter" && handleConfirm()}
              className={error ? "border-destructive focus-visible:border-destructive" : ""}
              autoFocus
            />
            {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={!name.trim()}>
            确认并编辑
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
