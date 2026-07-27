// 根布局是全站唯一能输出 <html> 的地方，故 /zh 子树只能在内层声明语言（设计文档 §5.1）。
// SSR 首帧 <html lang> 仍是 en；语言信号由 hreflang + og:locale + JSON-LD inLanguage 承担，
// 此处的嵌套 lang 保证屏幕阅读器读到正确语言，客户端再同步 documentElement。
import { htmlLang } from "@/lib/i18n/config";
import { SyncHtmlLang } from "@/components/marketing/SyncHtmlLang";

export default function ZhLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang={htmlLang.zh}>
      <SyncHtmlLang lang={htmlLang.zh} />
      {children}
    </div>
  );
}
