export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4 bg-gradient-to-br from-aqua-50 via-background to-tech-soft/20">
      {/* 粉色科技光晕装饰 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-glow-1/25 blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-glow-2/20 blur-3xl" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
