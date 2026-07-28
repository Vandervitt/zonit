import { templateGalleryMetadata, TemplateGalleryView } from "@/components/marketing/pages/TemplateGallery";

export const metadata = templateGalleryMetadata("zh");

export default function Page() {
  return <TemplateGalleryView locale="zh" />;
}
