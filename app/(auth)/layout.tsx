export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #d8e2f0 0%, #e4ddf0 50%, #dce8f5 100%)",
      }}
    >
      {children}
    </div>
  );
}
