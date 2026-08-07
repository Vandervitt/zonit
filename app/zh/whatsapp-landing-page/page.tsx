import { whatsappMetadata, WhatsAppView } from "@/components/marketing/pages/WhatsApp";

export const metadata = whatsappMetadata("zh");

export default function Page() {
  return <WhatsAppView locale="zh" />;
}
