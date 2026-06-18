// app/admin/editor/page.tsx
// 模板选择页：选模板即建库并跳 /admin/editor/[id]（见 TemplateGalleryCard）。
import { TemplateGallery } from "@/landing-editor/components/TemplateGallery";

export default function EditorNextPage() {
  return <TemplateGallery />;
}
