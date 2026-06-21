import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/lib/constants";
import { SuperAdminProviders } from "./_shell/SuperAdminProviders";
import { SuperAdminShell } from "./_shell/SuperAdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user?.role !== UserRole.SUPER_ADMIN) {
    redirect("/");
  }

  return (
    <SuperAdminProviders>
      <SuperAdminShell>{children}</SuperAdminShell>
    </SuperAdminProviders>
  );
}
