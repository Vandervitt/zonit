import { AdminProviders } from "./_shell/AdminProviders";
import { AdminShell } from "./_shell/AdminShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProviders>
      <AdminShell>{children}</AdminShell>
    </AdminProviders>
  );
}
