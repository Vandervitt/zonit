import { templateGalleryMetadata, TemplateGalleryView } from "@/components/marketing/pages/TemplateGallery";

export const metadata = templateGalleryMetadata("en");

export default function Page() {
  return <TemplateGalleryView locale="en" />;
}
