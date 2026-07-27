import { AuthShell } from "@/components/auth/AuthShell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell locale="zh">{children}</AuthShell>;
}
