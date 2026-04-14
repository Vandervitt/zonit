"use client";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown } from "lucide-react";

const retentionData = [
  { month: "Jan", value: 60 },
  { month: "Feb", value: 75 },
  { month: "Mar", value: 55 },
  { month: "Apr", value: 80 },
  { month: "May", value: 90 },
  { month: "Jun", value: 70 },
];

export function AICoPilotCard() {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-slate-700 text-lg">The</span>
        <span className="bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-md">
          AI
        </span>
        <span className="text-slate-700 text-lg">Co-Pilot</span>
      </div>

      {/* AI Sphere Image */}
      <div className="flex items-center justify-center">
        <div className="w-32 h-32 rounded-full overflow-hidden relative">
          <img
            src="https://images.unsplash.com/photo-1726243204557-ec314c0273a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMEFJJTIwc3BoZXJlJTIwZGlnaXRhbCUyMGFydCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3NjE1OTM3Mnww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="AI Sphere"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Retention Section */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm text-slate-700">Retention</span>
          <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Monthly <ChevronDown className="w-3 h-3" />
          </button>
        </div>
        <p className="text-xs text-slate-400">Customer loyalty grew by 8%</p>

        {/* Mini Bar Chart */}
        <div className="mt-3 bg-slate-50 rounded-xl p-3">
          <p className="text-xs text-slate-400 mb-2">Retention · 2025</p>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retentionData} barSize={10} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" hide />
                <YAxis hide />
                <Bar
                  dataKey="value"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Generate Report Button */}
      <button className="w-full bg-slate-900 text-white text-sm py-3 rounded-xl hover:bg-slate-800 transition-colors">
        Generate Report
      </button>
    </div>
  );
}
