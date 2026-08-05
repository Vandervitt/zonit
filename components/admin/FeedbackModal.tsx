"use client";

import { useState } from "react";
import { Modal, Input, Tag, Typography, App } from "antd";
import { ApiRoutes } from "@/lib/constants";
import type { FeedbackSource, FeedbackContext } from "@/lib/feedback";
import { useAdminT } from "@/lib/i18n/admin/context";

export interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  source: FeedbackSource;
  title: string;
  prompt: string;
  /** 快捷原因标签；选一个即可提交，文本框为选填补充。留空则纯文本反馈。 */
  quickReasons?: string[];
  context?: FeedbackContext;
}

export function FeedbackModal({
  open, onClose, source, title, prompt, quickReasons = [], context = {},
}: FeedbackModalProps) {
  const { message } = App.useApp();
  const t = useAdminT().shell.feedback;
  const [reason, setReason] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = Boolean(reason) || text.trim().length > 0;

  function reset() {
    setReason(null);
    setText("");
    setSubmitting(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    const detail = text.trim();
    const composed = [reason, detail].filter(Boolean).join("：");
    try {
      const res = await fetch(ApiRoutes.Feedback, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source,
          message: composed,
          context: { ...context, reason: reason ?? undefined },
        }),
      });
      if (res.ok) {
        message.success(t.thanks);
        handleClose();
      } else {
        message.error(t.failed);
        setSubmitting(false);
      }
    } catch {
      message.error(t.networkFailed);
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      onCancel={handleClose}
      onOk={submit}
      okText={t.send}
      cancelText={t.later}
      okButtonProps={{ disabled: !canSubmit, loading: submitting }}
      destroyOnClose
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>{prompt}</Typography.Paragraph>
      {quickReasons.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {quickReasons.map((r) => (
            <Tag.CheckableTag
              key={r}
              checked={reason === r}
              onChange={(checked) => setReason(checked ? r : null)}
              style={{ marginBottom: 8, padding: "4px 10px", fontSize: 13 }}
            >
              {r}
            </Tag.CheckableTag>
          ))}
        </div>
      )}
      <Input.TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.placeholder}
        autoSize={{ minRows: 3, maxRows: 6 }}
        maxLength={2000}
        showCount
      />
    </Modal>
  );
}
