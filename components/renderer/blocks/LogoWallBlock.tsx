import type { LogoWallSchema } from "@/types/schema";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

export function LogoWallBlock({
  data,
  id,
  highlight,
}: {
  data: LogoWallSchema;
  id?: string;
  highlight?: boolean;
}) {
  return (
    <section id={id} className="px-5 py-8 bg-white" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      {data.title && <p className="text-xs text-center text-slate-400 uppercase tracking-widest mb-4">{data.title}</p>}
      <div className="flex flex-wrap justify-center items-center gap-6">
        {data.logos.map(logo => {
          const img = <img key={logo.id} src={logo.src} alt={logo.alt} className="h-7 object-contain opacity-60 grayscale" />;
          return logo.url ? (
            <a key={logo.id} href={logo.url} target="_blank" rel="noopener noreferrer">{img}</a>
          ) : img;
        })}
      </div>
    </section>
  );
}
