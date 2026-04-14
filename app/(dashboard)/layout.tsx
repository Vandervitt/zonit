import { Sidebar } from "../../components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #d8e2f0 0%, #e4ddf0 50%, #dce8f5 100%)",
      }}
    >
      <div className="w-full rounded-3xl overflow-hidden shadow-2xl flex bg-slate-100/60 backdrop-blur-md min-h-[680px]">
        <Sidebar />
        {children}
      </div>
    </div>
  );
}
