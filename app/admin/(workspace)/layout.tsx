import { getFounderContact } from "@/lib/platform-settings";
import { AdminProviders } from "./_shell/AdminProviders";
import { AdminShell } from "./_shell/AdminShell";

// admin 为登录后按用户渲染的动态内容，且本布局在服务端读取平台设置(DB)。
// 声明 force-dynamic 避免 next build 期把 admin 路由静态预渲染而在无 DB 环境连库失败。
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const founderContact = await getFounderContact();
  return (
    <AdminProviders>
      <AdminShell founderContact={founderContact}>{children}</AdminShell>
    </AdminProviders>
  );
}
