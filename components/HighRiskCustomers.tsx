import { MoreHorizontal, Star } from "lucide-react";

const customers = [
  {
    id: 1,
    name: "Ralph Edwards",
    avatar:
      "https://images.unsplash.com/photo-1762522926157-bcc04bf0b10a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGJyb3duJTIwaGFpcnxlbnwxfHx8fDE3NzYxNTkzNzl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    riskLevel: 3,
    keyFactor: "Low activity",
    accountValue: "$12,500",
    feedback: 3,
  },
  {
    id: 2,
    name: "Floyd Miles",
    avatar:
      "https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBwb3J0cmFpdCUyMGhlYWRzaG90fGVufDF8fHx8MTc3NjEwOTcxM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    riskLevel: 2,
    keyFactor: "Inactivity",
    accountValue: "$7,240",
    feedback: 0,
  },
  {
    id: 3,
    name: "Jenny Wilson",
    avatar:
      "https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBvcnRyYWl0JTIwaGVhZHNob3R8ZW58MXx8fHwxNzc2MTEwNzA2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    riskLevel: 2,
    keyFactor: "Low engagement",
    accountValue: "$91,000",
    feedback: 2,
  },
];

function RiskBars({ level }: { level: number }) {
  return (
    <div className="flex items-end gap-0.5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`rounded-sm transition-all ${
            i <= level
              ? i === 1
                ? "bg-rose-400"
                : i === 2
                ? "bg-rose-500"
                : "bg-rose-600"
              : "bg-slate-200"
          }`}
          style={{
            width: 5,
            height: 8 + i * 3,
          }}
        />
      ))}
    </div>
  );
}

function FeedbackStars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= count
              ? "fill-blue-400 text-blue-400"
              : "fill-slate-200 text-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

export function HighRiskCustomers() {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-800">High-Risk Customers</h3>
        <button className="text-sm text-blue-500 hover:text-blue-600 transition-colors">
          See all
        </button>
      </div>

      {/* Table */}
      <div className="w-full">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1fr_2fr_1.5fr_1.5fr_auto] gap-4 px-2 pb-2 border-b border-slate-100">
          {["Name", "Risk", "Key factors", "Account value", "Feedback", ""].map(
            (h) => (
              <span key={h} className="text-xs text-slate-400">
                {h}
              </span>
            )
          )}
        </div>

        {/* Rows */}
        {customers.map((c) => (
          <div
            key={c.id}
            className="grid grid-cols-[2fr_1fr_2fr_1.5fr_1.5fr_auto] gap-4 items-center px-2 py-3 border-b border-slate-50 hover:bg-slate-50/50 rounded-xl transition-colors"
          >
            {/* Name */}
            <div className="flex items-center gap-2.5">
              <img
                src={c.avatar}
                alt={c.name}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <span className="text-sm text-slate-700 truncate">{c.name}</span>
            </div>

            {/* Risk */}
            <RiskBars level={c.riskLevel} />

            {/* Key factor */}
            <span className="text-sm text-slate-500">{c.keyFactor}</span>

            {/* Account Value */}
            <span className="text-sm text-slate-700">{c.accountValue}</span>

            {/* Feedback */}
            <FeedbackStars count={c.feedback} />

            {/* More */}
            <button className="text-slate-300 hover:text-slate-500 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
