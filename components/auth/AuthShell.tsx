/**
 * 登录/注册页的居中卡片外壳。
 * 英文侧由 app/(auth)/layout.tsx 提供，中文侧由 app/zh/(auth)/layout.tsx 提供——
 * 两处共用本组件，避免版式重复。
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4 bg-gradient-to-br from-aqua-50 via-background to-tech-soft/20">
      {/* 粉色科技光晕装饰 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-glow-1/25 blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-glow-2/20 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
