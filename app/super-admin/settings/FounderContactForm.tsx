"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Form, Input, Button, App, Typography } from "antd";
import { WechatOutlined, MailOutlined, LinkOutlined } from "@ant-design/icons";
import type { FounderContact } from "@/lib/platform-settings";

export function FounderContactForm({ initial }: { initial: FounderContact }) {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<FounderContact>();
  const [saving, setSaving] = useState(false);

  async function onSave(values: FounderContact) {
    setSaving(true);
    try {
      const res = await fetch("/api/super-admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          wechatId: values.wechatId ?? "",
          wechatQrUrl: values.wechatQrUrl ?? "",
          email: values.email ?? "",
        }),
      });
      if (res.ok) {
        message.success("已保存，admin 端即时生效");
        router.refresh();
      } else {
        message.error("保存失败，请检查填写内容后重试");
      }
    } catch {
      message.error("保存失败，请检查网络后重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card
      title="联系创始人配置"
      extra={<Typography.Text type="secondary">admin 端侧边栏「联系创始人」入口展示的联系方式</Typography.Text>}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initial}
        onFinish={onSave}
        requiredMark={false}
        style={{ maxWidth: 520 }}
      >
        <Form.Item
          label="微信号"
          name="wechatId"
          extra="用户可一键复制添加；留空则弹层不展示微信号文本。"
        >
          <Input prefix={<WechatOutlined style={{ color: "#07c160" }} />} placeholder="如：zapbridge-founder" allowClear />
        </Form.Item>

        <Form.Item
          label="微信二维码图片 URL"
          name="wechatQrUrl"
          extra="填图片直链（可在「素材库」上传后复制地址）；留空则显示占位方块。"
          rules={[{ type: "url", message: "请填写合法的图片链接（http/https）", warningOnly: false, transform: (v) => v || undefined }]}
        >
          <Input prefix={<LinkOutlined />} placeholder="https://.../founder-wechat-qr.png" allowClear />
        </Form.Item>

        <Form.Item
          label="联系邮箱"
          name="email"
          extra="用户点「发邮件」时的收件地址；留空则不展示发邮件按钮。"
          rules={[{ type: "email", message: "请填写合法邮箱地址", transform: (v) => v || undefined }]}
        >
          <Input prefix={<MailOutlined />} placeholder="support@zapbridge.tech" allowClear />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={saving}>保存</Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
