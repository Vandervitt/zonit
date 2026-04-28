"use client";

import { useRef, useState } from "react";
import { Upload, FileJson, Trash2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PreviewRenderer } from "@/components/sites/PreviewRenderer";
import { PresetTemplateSchema } from "@/lib/schema.zod";
import { invalidateTemplatesCache } from "@/lib/use-templates";
import type { PresetTemplate } from "@/lib/templates";
import type { ZodIssue } from "zod";

interface Props {
  initialTemplates: PresetTemplate[];
}

interface ParseError {
  type: "json" | "schema";
  message: string;
  issues?: ZodIssue[];
}

export function TemplatesAdminClient({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [parsed, setParsed] = useState<PresetTemplate | null>(null);
  const [parseError, setParseError] = useState<ParseError | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch (e) {
        setParsed(null);
        setParseError({ type: "json", message: (e as Error).message });
        return;
      }
      const result = PresetTemplateSchema.safeParse(raw);
      if (!result.success) {
        setParsed(null);
        setParseError({
          type: "schema",
          message: "JSON 不符合落地页 Schema",
          issues: result.error.issues,
        });
        return;
      }
      setParsed(result.data);
      setParseError(null);
    };
    reader.readAsText(file);
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function clearSelection() {
    setParsed(null);
    setParseError(null);
    setFileName("");
  }

  async function handleSave() {
    if (!parsed) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "保存失败");
      }
      const saved: PresetTemplate = data.template;
      setTemplates(prev => {
        const exists = prev.some(t => t.id === saved.id);
        return exists ? prev.map(t => (t.id === saved.id ? saved : t)) : [...prev, saved];
      });
      invalidateTemplatesCache();
      toast.success(`模板 "${saved.name}" 已保存`);
      clearSelection();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`确认删除模板 "${name}"？此操作不可撤销。`)) return;
    try {
      const res = await fetch(`/api/admin/templates/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "删除失败");
      }
      setTemplates(prev => prev.filter(t => t.id !== id));
      invalidateTemplatesCache();
      toast.success(`模板 "${name}" 已删除`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function handleReupload(t: PresetTemplate) {
    setParsed(t);
    setParseError(null);
    setFileName(`${t.id}.json (从已有模板导入)`);
  }

  const isOverwrite = parsed && templates.some(t => t.id === parsed.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">预设模板</h1>
        <p className="text-slate-500 mt-1">上传 JSON 文件创建预设模板，按落地页 Schema 严格校验。</p>
      </div>

      {/* Upload + Preview 两栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload + Errors */}
        <Card className="p-5 space-y-4">
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
          >
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-700">拖拽 JSON 文件到此处，或点击选择文件</p>
            <p className="text-xs text-slate-400 mt-1">需符合 PresetTemplate 结构</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={onPickFile}
              className="hidden"
            />
          </div>

          {fileName && (
            <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileJson className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-sm text-slate-700 truncate">{fileName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearSelection}>清除</Button>
            </div>
          )}

          {parseError && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {parseError.type === "json" ? "JSON 解析失败" : "Schema 校验失败"}
                </span>
              </div>
              <p className="text-xs text-rose-600">{parseError.message}</p>
              {parseError.issues && (
                <ul className="text-xs text-rose-600 space-y-1 max-h-48 overflow-y-auto font-mono">
                  {parseError.issues.map((iss, i) => (
                    <li key={i}>
                      <span className="text-rose-500">[{iss.path.join(".") || "root"}]</span>{" "}
                      {iss.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {parsed && !parseError && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-semibold">校验通过</span>
              </div>
              <dl className="text-xs space-y-1 text-slate-600">
                <div className="flex"><dt className="w-20 text-slate-400">ID</dt><dd className="font-mono">{parsed.id}</dd></div>
                <div className="flex"><dt className="w-20 text-slate-400">名称</dt><dd>{parsed.name}</dd></div>
                <div className="flex"><dt className="w-20 text-slate-400">类别</dt><dd>{parsed.category}</dd></div>
                <div className="flex"><dt className="w-20 text-slate-400">描述</dt><dd>{parsed.description}</dd></div>
              </dl>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {saving ? "保存中..." : isOverwrite ? "覆盖保存" : "保存模板"}
              </Button>
            </div>
          )}
        </Card>

        {/* Right: Live Preview */}
        <Card className="p-0 overflow-hidden bg-slate-100">
          <div className="bg-slate-800 text-slate-300 text-xs px-4 py-2 flex items-center justify-between">
            <span>实时预览</span>
            {parsed && <span className="font-mono">{parsed.data.templateName}</span>}
          </div>
          <div className="h-[680px] overflow-y-auto bg-white">
            {parsed ? (
              <PreviewRenderer template={parsed.data} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                上传 JSON 后此处将显示实时预览
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Existing Templates Table */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">已有模板（{templates.length}）</h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-900">ID</TableHead>
                <TableHead className="font-semibold text-slate-900">名称</TableHead>
                <TableHead className="font-semibold text-slate-900">类别</TableHead>
                <TableHead className="font-semibold text-slate-900">描述</TableHead>
                <TableHead className="font-semibold text-slate-900 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                    暂无预设模板，请在上方上传 JSON 创建
                  </TableCell>
                </TableRow>
              ) : (
                templates.map(t => (
                  <TableRow key={t.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-xs text-slate-500">{t.id}</TableCell>
                    <TableCell className="text-sm text-slate-900">{t.name}</TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {t.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-md truncate">{t.description}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReupload(t)}
                          title="加载到预览以重新上传/覆盖"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(t.id, t.name)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
