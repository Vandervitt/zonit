import { whatsappMetadata, WhatsAppView } from "@/components/marketing/pages/WhatsApp";

export const metadata = whatsappMetadata("en");

export default function Page() {
  return <WhatsAppView locale="en" />;
}
