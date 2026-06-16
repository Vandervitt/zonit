// app/editor-next/page.tsx
// 薄路由入口：无 template 参数时展示模板选择页；带 ?template=<id> 时挂载对应种子的编辑器。
import { Editor } from "@/landing-editor/Editor";
import { TemplateGallery } from "@/landing-editor/components/TemplateGallery";

export default async function EditorNextPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;
  if (!template) return <TemplateGallery />;
  return <Editor templateId={template} />;
}
