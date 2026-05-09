import type { ReviewsSchema, ReviewItem } from "@/types/schema";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= rating ? "text-amber-400" : "text-slate-200"}>★</span>
      ))}
    </div>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <div className="flex items-start gap-2 mb-2">
        {item.avatar ? (
          <img src={item.avatar} alt={item.authorName} className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600 shrink-0">
            {item.authorName.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-800">{item.authorName}</p>
          {item.authorRole && <p className="text-[10px] text-slate-400">{item.authorRole}</p>}
        </div>
        <StarRating rating={item.rating} />
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{item.content}</p>
      {item.proofImage && (
        <img src={item.proofImage} alt="Proof" className="mt-3 w-full rounded-lg object-cover max-h-32" />
      )}
      {item.proofVideo && (
        <video className="mt-3 aspect-video w-full rounded-lg bg-slate-200 object-cover" src={item.proofVideo} controls />
      )}
      {(item.sourcePlatform || item.country) && (
        <p className="text-[10px] text-slate-400 mt-2">
          {[item.sourcePlatform, item.country].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
}

export function ReviewsBlock({
  data,
  id,
  highlight,
}: {
  data: ReviewsSchema;
  id?: string;
  highlight?: boolean;
}) {
  const { ratingSummary } = data;
  const scale = ratingSummary?.scale ?? 5;
  const normalizedRating = ratingSummary ? Math.round((ratingSummary.average / scale) * 5) : 0;

  return (
    <section id={id} className="py-10" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <div className="px-5">
        <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
        {data.subtitle && <p className="text-xs text-center text-slate-500 mb-2">{data.subtitle}</p>}
        {ratingSummary && (
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="text-2xl text-amber-400 font-bold">{ratingSummary.average}</span>
            <StarRating rating={normalizedRating} />
            {ratingSummary.totalLabel && (
              <span className="text-xs text-slate-400">({ratingSummary.totalLabel})</span>
            )}
          </div>
        )}
      </div>
      <div className="px-5 space-y-3">
        {data.items.map(item => <ReviewCard key={item.id} item={item} />)}
      </div>
      {data.disclaimer && (
        <p className="px-5 mt-4 text-[10px] text-slate-400 text-center">{data.disclaimer}</p>
      )}
    </section>
  );
}
