"use client";

import { SessionProvider } from "next-auth/react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import "@ant-design/v5-patch-for-react-19";
import { adminTheme } from "@/lib/theme/antd-theme";
import { AdminLocaleProvider } from "@/lib/i18n/admin/context";
import type { Locale } from "@/lib/i18n/config";

const ANTD_LOCALE = { en: enUS, zh: zhCN };
// dayjs 的中文 locale 标识是 "zh-cn"（不是 "zh"），英文是内置的 "en"，无需 import。
const DAYJS_LOCALE = { en: "en", zh: "zh-cn" };

// SessionProvider 在此（admin 子树需要 useSession）；根 layout 不再全局提供，
// 避免公开落地页无谓拉取 /api/auth/session。
export function AdminProviders({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  // dayjs 的 locale 是**全局单例**，不是 React 状态，故在渲染期同步设置而非 useEffect：
  // 放进 effect 会让首屏先用错误语言渲染一遍日期再纠正。
  // 这是后台日期的第二条路径——ConfigProvider 只管 antd 自己的组件文案，
  // dayjs.format() 的星期/月份名归这里管，此前全仓从未设置过。
  dayjs.locale(DAYJS_LOCALE[locale]);

  return (
    <SessionProvider>
      <AdminLocaleProvider locale={locale}>
        <AntdRegistry>
          <ConfigProvider theme={adminTheme} locale={ANTD_LOCALE[locale]}>
            <App>{children}</App>
          </ConfigProvider>
        </AntdRegistry>
      </AdminLocaleProvider>
    </SessionProvider>
  );
}
