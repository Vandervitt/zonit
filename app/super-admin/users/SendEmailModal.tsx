"use client";

import { useState } from "react";
import { App, Input, Modal, Select, Space, Typography } from "antd";
import {
  ADMIN_EMAIL_TEMPLATES, fillAdminEmailTemplate, type AdminEmailTemplateId,
} from "@/lib/super-admin/email-templates";

const TEMPLATE_OPTIONS = (Object.keys(ADMIN_EMAIL_TEMPLATES) as AdminEmailTemplateId[]).map((id) => ({
  value: id, label: ADMIN_EMAIL_TEMPLATES[id].label,
}));

export function SendEmailModal({
  open, userId, email, name, onClose, onSent,
}: {
  open: boolean; userId: string; email: string; name: string | null;
  onClose: () => void; onSent: () => void;
}) {
  const { message, modal } = App.useApp();
  const [template, setTemplate] = useState<AdminEmailTemplateId>("stuck_check_in");
  const [draft, setDraft] = useState(() => fillAdminEmailTemplate("stuck_check_in", { name }));
  const [sending, setSending] = useState(false);

  function pickTemplate(id: AdminEmailTemplateId) {
    setTemplate(id);
    setDraft(fillAdminEmailTemplate(id, { name }));
  }

  async function send() {
    setSending(true);
    try {
      const res = await fetch(`/api/super-admin/users/${userId}/email`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error(String(res.status));
      message.success("已发送，并记入跟进备注");
      onSent();
      onClose();
    } catch {
      message.error("发送失败，未记入备注，请重试");
    } finally {
      setSending(false);
    }
  }

  const ready = draft.subject.trim() !== "" && draft.body.trim() !== "";

  return (
    <Modal
      title="发邮件"
      open={open}
      width={640}
      okText="发送"
      okButtonProps={{ disabled: !ready }}
      confirmLoading={sending}
      onCancel={onClose}
      // 发出去就收不回：再确认一次收件人。
      onOk={() => modal.confirm({
        title: "确认发送？",
        content: `将以平台发件地址发送给 ${email}，对方回复会进入创始人邮箱。发出后无法撤回。`,
        okText: "发送",
        onOk: send,
      })}
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Typography.Text type="secondary">收件人：{email}</Typography.Text>
        <Select aria-label="邮件模板" style={{ width: "100%" }} value={template} options={TEMPLATE_OPTIONS} onChange={pickTemplate} />
        <Input
          aria-label="邮件主题"
          placeholder="主题"
          maxLength={200}
          value={draft.subject}
          onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
        />
        <Input.TextArea
          aria-label="邮件正文"
          autoSize={{ minRows: 10, maxRows: 20 }}
          maxLength={10_000}
          value={draft.body}
          onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
        />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          纯文本发送、不含链接追踪；回复地址取「平台设置」里的创始人邮箱。发送成功会自动记一条跟进备注。
        </Typography.Text>
      </Space>
    </Modal>
  );
}
