// landing-renderer/sections/leadFormAnchor.ts
// 留资表单锚点 id 的单一真源。
//
// ⚠️ 刻意独立成文件，不能放回 LeadForm.tsx —— 那是 "use client" 模块，
// 服务端代码（channel-href.ts / 渲染器）import 它拿到的是**客户端引用代理**而不是
// 字符串值，拼进 href 会变成一段 React 报错文本，页面上的表单按钮全是死的。
// 这类问题跑在 Node 里的单元测试测不出来（没有 RSC 边界），只有真机走查能发现。
//
// schema 保证每页至多一个 leadForm，故固定 id 不会重复。
export const LEAD_FORM_ANCHOR_ID = "lead-form";
