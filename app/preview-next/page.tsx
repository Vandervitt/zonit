// app/preview-next/page.tsx
// 独立预览路由：用样例数据驱动新渲染器（不接编辑器 / 数据库）。
import { LandingPage } from "@/landing-renderer/LandingPage";
import { skincareConsultDraft } from "@/landing-editor/samples/skincareConsultDraft";

export default function PreviewNextPage() {
  return <LandingPage page={skincareConsultDraft} />;
}
