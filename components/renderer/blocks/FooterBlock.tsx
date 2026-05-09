"use client";

import type { MicroFooterSchema, FooterLink } from "@/types/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

function FooterLinkItem({ link, index }: { link: FooterLink; index: number }) {
  if (link.content?.trim()) {
    return (
      <Dialog key={index}>
        <DialogTrigger className="text-[10px] text-slate-400 hover:text-white underline">
          {link.text}
        </DialogTrigger>
        <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto border-slate-200 bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle>{link.text}</DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{link.content}</div>
        </DialogContent>
      </Dialog>
    );
  }
  if (link.url?.trim()) {
    return (
      <a
        key={index}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] text-slate-400 hover:text-white underline"
      >
        {link.text}
      </a>
    );
  }
  return null;
}

export function FooterBlock({
  data,
  highlight,
}: {
  data: MicroFooterSchema;
  highlight?: boolean;
}) {
  return (
    <footer id="footer" className="bg-slate-800 text-white px-5 py-8 text-center" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-sm mb-3">{data.brandName}</p>
      {data.disclaimer && (
        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">{data.disclaimer}</p>
      )}
      <div className="flex flex-wrap justify-center gap-3 mb-3">
        {data.links.map((link, i) => <FooterLinkItem key={i} link={link} index={i} />)}
      </div>
      {data.socialLinks && data.socialLinks.length > 0 && (
        <div className="flex justify-center gap-3 mb-3">
          {data.socialLinks.map(s => (
            <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-400 hover:text-white capitalize">
              {s.platform}
            </a>
          ))}
        </div>
      )}
      {data.contactEmail && (
        <p className="text-[10px] text-slate-400 mb-2">{data.contactEmail}</p>
      )}
      <p className="text-[10px] text-slate-500">© {data.copyrightYear} {data.brandName}. All rights reserved.</p>
    </footer>
  );
}
