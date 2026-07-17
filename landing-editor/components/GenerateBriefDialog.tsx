"use client";
// landing-editor/components/GenerateBriefDialog.tsx
//
// 编辑器内「AI 一键成页」资料表单：进入编辑器后（?ai=1）默认弹出，填写产品资料后调用
// /api/landing-pages/generate（带 pageId）为当前空白页原地生成文案，成功即把生成的
// LandingPageDraft 灌入编辑器 store（autosave 兜底落库），并清掉 URL 上的 ?ai 标记。
//
// UI 用 Ant Design（与 admin / super-admin 一致；shadcn 仅用于官网与渲染器）。编辑器路由
// 不在 (workspace) 布局下、拿不到全局 antd Provider，故本组件自带 ConfigProvider + App，
// 复用 adminTheme，使弹窗风格与后台其余表单统一。
import "@ant-design/v5-patch-for-react-19";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { App, ConfigProvider, Modal, Form, Input, Select, Typography } from "antd";
import zhCN from "antd/locale/zh_CN";
import { adminTheme } from "@/lib/theme/antd-theme";
import { handleSessionExpired } from "@/lib/auth-client";
import { landingEditorPath } from "@/lib/constants";
import type { LandingPageDraft } from "@/types/schema.draft";
import { useEditorDispatch } from "../store/editorStore";
import { useMeta } from "../MetaContext";

/** 生成语言选项；value 直接作为 brief.language 注入 prompt。 */
const LANGUAGES = [
  "English",
  "简体中文",
  "繁體中文",
  "Español",
  "Français",
  "Deutsch",
  "Português",
  "日本語",
  "العربية",
  "Tiếng Việt",
];

interface BriefForm {
  productName: string;
  description: string;
  targetAudience?: string;
  tone?: string;
  ctaGoal?: string;
  language: string;
  pastedIntro?: string;
}

export function GenerateBriefDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  // 自带 antd 上下文：编辑器路由缺全局 Provider，component={false} 不额外产生 DOM 包裹。
  return (
    <ConfigProvider theme={adminTheme} locale={zhCN}>
      <App component={false}>
        <BriefModal defaultOpen={defaultOpen} />
      </App>
    </ConfigProvider>
  );
}

function BriefModal({ defaultOpen }: { defaultOpen: boolean }) {
  const router = useRouter();
  const dispatch = useEditorDispatch();
  const { pageId } = useMeta();
  const { message } = App.useApp();
  const [form] = Form.useForm<BriefForm>();
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);

  /** 关闭并清掉 ?ai 标记，避免刷新再次自动弹出。 */
  function close() {
    setOpen(false);
    router.replace(landingEditorPath(pageId));
  }

  async function handleOk() {
    let values: BriefForm;
    try {
      values = await form.validateFields();
    } catch {
      // 校验失败：antd 自动在对应字段展示错误
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/landing-pages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, brief: values }),
      });
      if (handleSessionExpired(res, router)) return;
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "ai_quota_exhausted")
          message.error("AI 额度已用完，请升级或加购 credits");
        else if (data.error === "limit_exceeded")
          message.error("落地页数量已达套餐上限");
        else message.error("生成失败，请重试");
        return;
      }
      dispatch({ kind: "replaceDraft", draft: data.draft as LandingPageDraft });
      message.success("已按你的资料生成文案，可继续在编辑器中调整");
      close();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="AI 一键成页"
      open={open}
      onOk={handleOk}
      onCancel={close}
      okText="一键成页"
      cancelText="手动编辑"
      confirmLoading={loading}
      maskClosable={false}
      destroyOnHidden
      centered
      // 限制整体高度、让表单区自身滚动，避免长表单把弹窗顶出视口上下缘。
      styles={{ body: { maxHeight: "calc(100vh - 220px)", overflowY: "auto" } }}
    >
      <Typography.Paragraph type="secondary">
        填写产品或公司信息，AI 将依据当前模板为这张落地页自动生成可投放文案。也可点「手动编辑」直接关闭。
      </Typography.Paragraph>
      <Form form={form} layout="vertical" initialValues={{ language: "English" }} requiredMark="optional">
        <Form.Item
          label="产品 / 公司名"
          name="productName"
          rules={[{ required: true, message: "请输入产品 / 公司名" }]}
        >
          <Input placeholder="如 Acme 出海咨询" maxLength={200} />
        </Form.Item>
        <Form.Item
          label="它做什么 / 解决什么"
          name="description"
          rules={[{ required: true, message: "请填写产品介绍" }]}
        >
          <Input.TextArea rows={3} placeholder="一句话说明产品价值与解决的问题" maxLength={4000} showCount />
        </Form.Item>
        <Form.Item label="目标客户" name="targetAudience">
          <Input placeholder="如 东南亚中小电商卖家" maxLength={500} />
        </Form.Item>
        <Form.Item label="语气" name="tone">
          <Input placeholder="专业 / 亲和 / 紧迫 / 高端" maxLength={200} />
        </Form.Item>
        <Form.Item label="转化目标" name="ctaGoal">
          <Input placeholder="咨询 / 预约 / 留资 / WhatsApp" maxLength={200} />
        </Form.Item>
        <Form.Item label="生成语言" name="language">
          <Select options={LANGUAGES.map((l) => ({ value: l, label: l }))} />
        </Form.Item>
        <Form.Item label="可选：粘贴公司 / 产品介绍" name="pastedIntro">
          <Input.TextArea rows={3} placeholder="有现成介绍可粘贴，AI 会据此提炼文案" maxLength={8000} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
}
