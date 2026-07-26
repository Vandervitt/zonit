// 服务端渲染 JSON-LD 结构化数据。
// 将 < > & 转成 unicode 转义序列：既保证 JSON-LD 合法，又杜绝内容中出现
// </script> 时逃逸破坏页面（XSS 防护）。转义后字符串不含原生 < > &，
// 交给 React 作文本子节点渲染即为合法脚本内容，无需 dangerouslySetInnerHTML。
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  return <script type="application/ld+json">{json}</script>;
}
