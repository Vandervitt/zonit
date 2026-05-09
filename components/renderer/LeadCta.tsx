import type { CallToAction } from "@/types/schema";
import { ctaThemeColor } from "@/lib/constants";

export function leadCtaHref(cta: CallToAction): string {
  switch (cta.destination.type) {
    case "phone":
      return `tel:${cta.destination.phone}`;
    case "email":
      return `mailto:${cta.destination.email}`;
    case "form":
      return `#${cta.destination.formId}`;
    case "whatsapp": {
      const msg = "prefilledMessage" in cta ? cta.prefilledMessage : undefined;
      if (!msg) return cta.destination.url;
      try {
        const url = new URL(cta.destination.url);
        url.searchParams.set("text", msg);
        return url.toString();
      } catch {
        const sep = cta.destination.url.includes("?") ? "&" : "?";
        return `${cta.destination.url}${sep}text=${encodeURIComponent(msg)}`;
      }
    }
    default:
      return cta.destination.url;
  }
}

export function LeadCta({
  cta,
  primaryColor,
  className,
}: {
  cta: CallToAction;
  primaryColor: string;
  className: string;
}) {
  const rel = cta.target === "_blank" ? "noopener noreferrer" : undefined;
  return (
    <a
      href={leadCtaHref(cta)}
      target={cta.target}
      rel={rel}
      className={className}
      style={{ backgroundColor: ctaThemeColor(cta.channel, primaryColor) }}
    >
      {cta.text}
    </a>
  );
}
