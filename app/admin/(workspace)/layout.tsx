import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden p-4 bg-gradient-to-br from-bloom-50 via-background to-tech-soft/20">
      {/* 粉色科技光晕装饰 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/3 h-[28rem] w-[28rem] rounded-full bg-glow-pink/20 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-glow-violet/15 blur-3xl" />
      </div>
      <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl shadow-bloom-500/10 flex bg-white/60 backdrop-blur-md min-h-[680px] border border-bloom-100">
        <Sidebar />
        {children}
      </div>
    </div>
  );
}
