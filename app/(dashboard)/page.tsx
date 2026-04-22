import { Search, ChevronDown, Calendar } from "lucide-react";
import { SalesFunnelCard } from "../../components/SalesFunnelCard";
// import { AICoPilotCard } from "../../components/AICoPilotCard";
import { HighRiskCustomers } from "../../components/HighRiskCustomers";

export default function App() {
  return (
    <main className="flex-1 flex flex-col overflow-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-transparent">
        <h1 className="text-slate-800 text-2xl">Analytical board</h1>

        <div className="flex items-center gap-3">
          {/* Chart Type */}
          <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <span className="text-slate-400 text-xs">Chart:</span>
            Funnel
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Search */}
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 w-48 shadow-sm">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400 w-full"
            />
          </div>

          {/* Calendar */}
          <button className="w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors">
            <Calendar className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </header>

      {/* Dashboard Grid */}
      <div className="flex-1 px-6 pb-6 flex flex-col gap-4">
        {/* Top Row: Funnel + AI Co-Pilot */}
        <div className="grid grid-cols-[1fr_220px] gap-4">
          <SalesFunnelCard />
          {/* <AICoPilotCard /> */}
        </div>

        {/* Bottom Row: High-Risk Customers */}
        <HighRiskCustomers />
      </div>
    </main>
  );
}
