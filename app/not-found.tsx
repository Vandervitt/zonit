// 全局 404：同时承接 notFound() 与未匹配 URL。
// 保持品牌中立——它会渲染在租户自有域名上，不暴露平台后台元素。
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-6 text-center">
      <p className="text-5xl font-semibold tracking-tight text-slate-900">404</p>
      <p className="text-base text-slate-500">This page isn’t available.</p>
    </main>
  );
}
