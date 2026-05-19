"use client";

import { Plus, Trash2, Zap, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type {
  ExtractedTemplate,
  HeroContent,
  FaqContent,
} from "@/components/template-extraction/types";

// ── Style constants (light theme) ─────────────────────────────────────────

const di =
  "h-9 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-400";
const dt =
  "text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-400 resize-none";
const card = "bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3";
const addBtn =
  "w-full h-8 text-xs border border-dashed border-slate-300 text-slate-500 hover:text-slate-700 hover:bg-slate-50 hover:border-slate-500 bg-transparent gap-1.5 rounded-md";
const delBtn =
  "h-7 w-7 shrink-0 flex items-center justify-center rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors";

// ── Shared sub-components ─────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      {children}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
        {label}
      </span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

// ── HeroEditor ────────────────────────────────────────────────────────────

function HeroEditor({
  data,
  onChange,
}: {
  data: HeroContent;
  onChange: (d: HeroContent) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Badge 文字">
        <Input
          className={di}
          value={data.badge ?? ""}
          onChange={e => onChange({ ...data, badge: e.target.value })}
          placeholder="✨ Free Consultation Available"
        />
      </Field>
      <Field label="主标题">
        <Textarea
          className={`${dt} min-h-[60px]`}
          value={data.title}
          onChange={e => onChange({ ...data, title: e.target.value })}
          placeholder="Your Main Headline"
        />
      </Field>
      <Field label="副标题">
        <Textarea
          className={`${dt} min-h-[60px]`}
          value={data.subtitle}
          onChange={e => onChange({ ...data, subtitle: e.target.value })}
          placeholder="Supporting description"
        />
      </Field>
      <SectionDivider label="图片" />
      <Field label="背景图 URL">
        <Input
          className={di}
          value={data.background.src}
          onChange={e =>
            onChange({ ...data, background: { ...data.background, src: e.target.value } })
          }
          placeholder="https://..."
        />
      </Field>
      {data.media && (
        <Field label="产品图 URL">
          <Input
            className={di}
            value={data.media.src}
            onChange={e =>
              onChange({ ...data, media: { ...data.media!, src: e.target.value } })
            }
            placeholder="https://..."
          />
        </Field>
      )}
      <SectionDivider label="其他" />
      <Field label="背书文字">
        <Input
          className={di}
          value={data.trustText ?? ""}
          onChange={e => onChange({ ...data, trustText: e.target.value })}
          placeholder="Reply within 10 minutes"
        />
      </Field>
    </div>
  );
}

// ── FaqEditor ─────────────────────────────────────────────────────────────

type FaqItem = { id: string; question: string; answer: string };

function FaqItemEditor({
  item,
  onChange,
  onRemove,
}: {
  item: FaqItem;
  onChange: (i: FaqItem) => void;
  onRemove: () => void;
}) {
  return (
    <div className={card}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Field label="问题">
            <Input
              className={`${di} h-8`}
              value={item.question}
              onChange={e => onChange({ ...item, question: e.target.value })}
            />
          </Field>
        </div>
        <button className={`${delBtn} mt-5`} onClick={onRemove}>
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <Field label="回答">
        <Textarea
          className={`${dt} min-h-[60px]`}
          value={item.answer}
          onChange={e => onChange({ ...item, answer: e.target.value })}
        />
      </Field>
    </div>
  );
}

function FaqEditor({
  data,
  onChange,
}: {
  data: FaqContent;
  onChange: (d: FaqContent) => void;
}) {
  const addItem = () =>
    onChange({
      ...data,
      items: [
        ...data.items,
        { id: crypto.randomUUID(), question: "Your question here?", answer: "Your answer here." },
      ],
    });

  return (
    <div className="space-y-4">
      <Field label="标题">
        <Input
          className={di}
          value={data.title}
          onChange={e => onChange({ ...data, title: e.target.value })}
        />
      </Field>
      <Field label="副标题">
        <Input
          className={di}
          value={data.subtitle ?? ""}
          onChange={e => onChange({ ...data, subtitle: e.target.value })}
        />
      </Field>
      <SectionDivider label="问答列表" />
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <FaqItemEditor
            key={item.id}
            item={item}
            onChange={updated =>
              onChange({
                ...data,
                items: data.items.map((it, ii) => (ii === i ? updated : it)),
              })
            }
            onRemove={() =>
              onChange({ ...data, items: data.items.filter((_, ii) => ii !== i) })
            }
          />
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={addItem}>
          <Plus className="w-3 h-3" />
          添加问题
        </Button>
      </div>
    </div>
  );
}

// ── Module metadata ───────────────────────────────────────────────────────

const MODULE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  hero: { label: "首屏", icon: <Zap className="w-3.5 h-3.5 text-rose-500" /> },
  faq: { label: "常见问题", icon: <HelpCircle className="w-3.5 h-3.5 text-violet-500" /> },
};

// ── Patch helper ──────────────────────────────────────────────────────────

function patchContent(
  template: ExtractedTemplate,
  dataKey: string,
  value: unknown,
): ExtractedTemplate {
  return { ...template, content: { ...template.content, [dataKey]: value } };
}

// ── Root export ───────────────────────────────────────────────────────────

export function ExtractedTemplateEditorPanel({
  template,
  onChange,
}: {
  template: ExtractedTemplate;
  onChange: (t: ExtractedTemplate) => void;
}) {
  const editableModules = template.modules.filter(
    m => m.type === "hero" || m.type === "faq",
  );

  if (editableModules.length === 0) {
    return (
      <div className="p-4 text-xs text-slate-400">此模板没有可编辑的模块。</div>
    );
  }

  return (
    <ScrollArea className="flex-1 min-h-0 overflow-hidden">
      <Accordion type="single" collapsible className="divide-y divide-slate-100">
        {editableModules.map(mod => {
          const meta = MODULE_META[mod.type];
          const content = template.content[mod.dataKey];

          return (
            <AccordionItem key={mod.id} value={mod.id} className="border-0">
              <AccordionTrigger className="hover:no-underline py-2.5 px-4 hover:bg-slate-50 data-[state=open]:bg-slate-50 [&>svg]:text-slate-400">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                    {meta.icon}
                  </div>
                  <p className="text-xs text-slate-700 truncate flex-1 text-left">
                    {meta.label}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t border-slate-100 px-4 pb-6 pt-3">
                {mod.type === "hero" && (
                  <HeroEditor
                    data={content as HeroContent}
                    onChange={v => onChange(patchContent(template, mod.dataKey, v))}
                  />
                )}
                {mod.type === "faq" && (
                  <FaqEditor
                    data={content as FaqContent}
                    onChange={v => onChange(patchContent(template, mod.dataKey, v))}
                  />
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </ScrollArea>
  );
}
