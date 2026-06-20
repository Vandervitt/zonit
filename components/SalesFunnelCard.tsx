"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MoreHorizontal, ChevronDown } from "lucide-react";

const funnelData = [
  { name: "Emails", value: 95000, pct: "100%" },
  { name: "Visits", value: 73400, pct: "76%" },
  { name: "Log in", value: 33100, pct: "38%" },
  { name: "Payments", value: 15700, pct: "21%" },
];

const chartData = [
  { x: "Emails", y: 95 },
  { x: "Visits", y: 73.4 },
  { x: "Log in", y: 33.1 },
  { x: "Payments", y: 15.7 },
];

const metrics = [
  { value: "123%", label: "ROI", color: "#e8315a" },
  { value: "5%", label: "Click-Through Rate", color: "#f59e0b" },
  { value: "450K", label: "Daily Active Users", color: "#7b5cff" },
];

export function SalesFunnelCard() {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-4 shadow-sm w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground">Sales Funnel Analytics</h3>
        <button className="flex items-center gap-1 text-sm text-muted-foreground border border-bloom-100 rounded-lg px-3 py-1.5 hover:bg-bloom-50 transition-colors">
          This week <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {funnelData.map((item) => (
          <div key={item.name}>
            <p className="text-foreground text-xl">{(item.value / 1000).toFixed(1).replace('.0','') + 'k'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.name}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="relative h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="funnelGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbad6" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#ffe3ef" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="x" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "white",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                fontSize: "12px",
              }}
              formatter={(val: number) => [`${val}k`, ""]}
            />
            <Area
              type="monotone"
              dataKey="y"
              stroke="#f03d83"
              strokeWidth={2.5}
              fill="url(#funnelGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Percentage labels at bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
          {funnelData.map((item) => (
            <span key={item.name} className="text-xs text-muted-foreground">
              {item.pct}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom metrics */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-bloom-100">
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-1 p-2">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-lg">{m.value}</span>
              <MoreHorizontal className="w-4 h-4 text-muted-foreground/50" />
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: m.color }}
              />
              <span className="text-xs text-muted-foreground">{m.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
