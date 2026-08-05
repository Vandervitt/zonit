import { cookies } from "next/headers";
import { auth } from "@/auth";
import { LOCALE_COOKIE } from "@/lib/i18n/config";
import { resolveAdminLocale } from "@/lib/i18n/admin";
import { getFounderContact } from "@/lib/platform-settings";
import { getPublishQuotaStatus } from "@/lib/publish-quota-db";
import { PublishQuotaBanner } from "@/components/billing/PublishQuotaBanner";
import { AdminProviders } from "./_shell/AdminProviders";
import { AdminShell } from "./_shell/AdminShell";

// admin 为登录后按用户渲染的动态内容，且本布局在服务端读取平台设置(DB)。
// 声明 force-dynamic 避免 next build 期把 admin 路由静态预渲染而在无 DB 环境连库失败。
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [founderContact, session, cookieStore] = await Promise.all([
    getFounderContact(),
    auth(),
    cookies(),
  ]);

  // 语言在服务端解析后以 prop 注入，客户端不自己判断：两侧算出不同结果会导致
  // 首屏文案闪烁一次。优先级见 resolveAdminLocale（用户显式选择 > 注册来源 > 默认）。
  const locale = resolveAdminLocale(
    session?.user?.locale,
    cookieStore.get(LOCALE_COOKIE)?.value,
  );

  // 超额横幅放在布局层：自动下线线上页是不可逆的对外影响，邮件无法确认送达，
  // 必须保证客户进后台任何页面都看得见（见 PublishQuotaBanner 注释）。
  // 查询失败不能拖垮整个后台，故单独兜住。
  let quota = null;
  if (session?.user?.id) {
    try {
      quota = await getPublishQuotaStatus(session.user.id, new Date());
    } catch (err) {
      console.error("[admin] 读取发布配额状态失败（忽略）:", err);
    }
  }
  const overQuota = quota?.overQuotaSince && quota.publishedCount > quota.limit ? quota : null;

  return (
    <AdminProviders locale={locale}>
      <AdminShell founderContact={founderContact}>
        {overQuota && (
          <PublishQuotaBanner
            publishedCount={overQuota.publishedCount}
            limit={overQuota.limit}
            daysLeft={overQuota.daysLeft ?? 0}
          />
        )}
        {children}
      </AdminShell>
    </AdminProviders>
  );
}
