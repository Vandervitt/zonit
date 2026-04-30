"use client"

import { useRouter } from "next/navigation";
import { Globe, Edit3, Trash2, ExternalLink, MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Site } from "../../lib/site-store";
import { useTemplates } from "../../lib/use-templates";
import { siteEditorPath } from "../../lib/constants";
import { heroBackgroundStyle } from "../../lib/templates";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" });
}

interface Props {
  site: Site;
  onDelete: (id: string) => void;
}

export function SiteCard({ site, onDelete }: Props) {
  const router = useRouter();
  const { templates } = useTemplates();
  const tpl = templates.find(t => t.id === site.templateId);
  const bgStyle = heroBackgroundStyle(tpl);
  const hasBg = Object.keys(bgStyle).length > 0;

  return (
    <Card
      className="border-0 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02] group cursor-pointer overflow-hidden gap-0"
      onClick={() => router.push(siteEditorPath(site.id))}
    >
      {/* Hero Preview */}
      <div
        className={`h-32 relative ${!hasBg ? `bg-gradient-to-br ${tpl?.gradient ?? "from-slate-400 to-slate-600"}` : ""}`}
        style={bgStyle}
      >
        {site.published ? (
          <Badge className="absolute top-2 right-2 bg-emerald-500 text-white border-0 text-xs">已发布</Badge>
        ) : (
          <Badge variant="secondary" className="absolute top-2 right-2 text-xs">草稿</Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-slate-800 truncate">{site.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {tpl?.name ?? site.templateId} · {tpl?.category}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => router.push(siteEditorPath(site.id))}>
                <Edit3 className="w-4 h-4 mr-2" /> 编辑
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className="w-4 h-4 mr-2" /> 预览
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(site.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> 删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>更新于 {formatDate(site.updatedAt)}</span>
          <button
            onClick={e => { e.stopPropagation(); router.push(`/domains?siteId=${site.id}`); }}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Globe className="w-3 h-3" />
            <span>绑定域名</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
