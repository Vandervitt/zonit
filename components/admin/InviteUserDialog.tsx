"use client";

import { useState } from "react";
import { Modal, Form, Input, Select, InputNumber, Button, App } from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import { PLANS, PlanId } from "@/lib/plans";
import { ApiRoutes } from "@/lib/constants";
import { jsonRequest } from "@/lib/api/fetcher";
import { useMutation } from "@/lib/api/use-mutation";

export function InviteUserDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const inviteMutation = useMutation(
    (payload: { email: string; plan: PlanId; duration_days: number }) =>
      jsonRequest(ApiRoutes.AdminInvite, "POST", payload),
    {
      onSuccess: () => {
        message.success("邀请已发送！邮件正在派送中。");
        setIsOpen(false);
        form.resetFields();
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "发送失败，请重试";
        void message.error(msg);
      },
    },
  );

  const isLoading = inviteMutation.isMutating;

  const handleOk = () => {
    form
      .validateFields()
      .then((values: { email: string; plan: PlanId; duration: number }) => {
        void inviteMutation.trigger({
          email: values.email,
          plan: values.plan,
          duration_days: values.duration,
        });
      })
      .catch(() => {
        // validateFields reject：表单校验失败，antd 自动展示错误提示
      });
  };

  return (
    <>
      <Button
        type="primary"
        icon={<UserAddOutlined />}
        onClick={() => setIsOpen(true)}
      >
        邀请用户
      </Button>

      <Modal
        title="发送专属邀请"
        open={isOpen}
        onCancel={() => {
          setIsOpen(false);
          form.resetFields();
        }}
        onOk={handleOk}
        okText="确认并发送邀请"
        cancelText="取消"
        confirmLoading={isLoading}
        destroyOnClose
      >
        <p style={{ color: "#64748b", marginBottom: 16, fontSize: 13 }}>
          向用户发送包含限时权益的注册链接。用户注册后将自动获得对应计划。
        </p>
        <Form form={form} layout="vertical" initialValues={{ plan: "pro", duration: 15 }}>
          <Form.Item
            label="用户邮箱"
            name="email"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入有效邮箱格式" },
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item
              label="赠送权益"
              name="plan"
              rules={[{ required: true, message: "请选择套餐" }]}
            >
              <Select placeholder="选择计划">
                {Object.entries(PLANS).map(([id, config]) => (
                  <Select.Option key={id} value={id}>
                    {config.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="权益时长（天）"
              name="duration"
              rules={[{ required: true, message: "请输入天数" }]}
            >
              <InputNumber min={1} max={365} style={{ width: "100%" }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
}
