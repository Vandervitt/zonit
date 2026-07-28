"use client";

import { useState } from "react";
import { Modal, Form, Select, InputNumber, Button, App, Segmented, Alert, Typography } from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import { PLANS, PlanId } from "@/lib/plans";
import { ApiRoutes } from "@/lib/constants";
import { jsonRequest } from "@/lib/api/fetcher";
import { useMutation } from "@/lib/api/use-mutation";

/** 链接有效期快捷预设（小时）；"custom" 走数字输入。 */
type LinkPreset = "24" | "72" | "168" | "custom";

const SKIP_LABEL: Record<string, string> = {
  already_registered: "已注册（邀请对老用户无效，请改用超管赠送）",
  duplicate: "重复邮箱，已合并",
  invalid_email: "邮箱格式不正确",
};

interface InviteResponse {
  ok: boolean;
  sent: string[];
  skipped: { email: string; reason: string }[];
  failed: { email: string; reason: string }[];
}

export function InviteUserDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [linkPreset, setLinkPreset] = useState<LinkPreset>("24");
  const [result, setResult] = useState<InviteResponse | null>(null);

  const inviteMutation = useMutation(
    (payload: {
      emails: string[];
      plan: PlanId;
      duration_days: number;
      link_expires_hours: number;
    }) => jsonRequest<InviteResponse>(ApiRoutes.AdminInvite, "POST", payload),
    {
      onSuccess: (data: InviteResponse) => {
        setResult(data);
        if (data.sent.length > 0) {
          message.success(`已发出 ${data.sent.length} 封邀请`);
        }
        // 有跳过/失败时保留弹窗，让超管看清逐条结果，不静默关闭。
        if (data.skipped.length === 0 && data.failed.length === 0) {
          setIsOpen(false);
          form.resetFields();
          setResult(null);
        }
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "发送失败，请重试";
        void message.error(msg);
      },
    },
  );

  const isLoading = inviteMutation.isMutating;

  function close() {
    setIsOpen(false);
    form.resetFields();
    setLinkPreset("24");
    setResult(null);
  }

  const handleOk = () => {
    form
      .validateFields()
      .then((values: { emails: string[]; plan: PlanId; duration: number; linkHours?: number }) => {
        const hours = linkPreset === "custom" ? (values.linkHours ?? 24) : Number(linkPreset);
        void inviteMutation.trigger({
          emails: values.emails,
          plan: values.plan,
          duration_days: values.duration,
          link_expires_hours: hours,
        });
      })
      .catch(() => {
        // validateFields reject：表单校验失败，antd 自动展示错误提示
      });
  };

  return (
    <>
      <Button type="primary" icon={<UserAddOutlined />} onClick={() => setIsOpen(true)}>
        邀请用户
      </Button>

      <Modal
        title="发送邀请"
        open={isOpen}
        onCancel={close}
        onOk={handleOk}
        okText="确认并发送邀请"
        cancelText="关闭"
        confirmLoading={isLoading}
        destroyOnClose
      >
        <p style={{ color: "#64748b", marginBottom: 16, fontSize: 13 }}>
          向一个或多个邮箱发送注册链接。受邀人用该邮箱注册后自动获得所选权益。
        </p>

        <Form
          form={form}
          layout="vertical"
          initialValues={{ plan: "pro", duration: 15, linkHours: 24 }}
        >
          <Form.Item
            label="用户邮箱"
            name="emails"
            extra="可粘贴或输入多个，回车分隔；一次最多 50 个"
            rules={[
              { required: true, message: "请至少输入一个邮箱" },
              {
                validator: (_, value: string[] | undefined) => {
                  const bad = (value ?? []).filter((v) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()));
                  return bad.length
                    ? Promise.reject(new Error(`邮箱格式不正确：${bad.join("、")}`))
                    : Promise.resolve();
                },
              },
            ]}
          >
            <Select
              mode="tags"
              tokenSeparators={[",", "，", " ", ";", "；"]}
              placeholder="user@example.com"
              open={false}
              suffixIcon={null}
            />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item label="赠送权益" name="plan" rules={[{ required: true, message: "请选择套餐" }]}>
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

          <Form.Item label="链接有效期" style={{ marginBottom: 8 }}>
            <Segmented
              value={linkPreset}
              onChange={(v) => setLinkPreset(v as LinkPreset)}
              options={[
                { label: "24 小时", value: "24" },
                { label: "3 天", value: "72" },
                { label: "7 天", value: "168" },
                { label: "自定义", value: "custom" },
              ]}
            />
            {linkPreset === "custom" && (
              <Form.Item name="linkHours" noStyle>
                <InputNumber
                  min={1}
                  max={720}
                  addonAfter="小时"
                  style={{ display: "block", marginTop: 10, width: 180 }}
                />
              </Form.Item>
            )}
          </Form.Item>

          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            超过有效期链接失效，需重新邀请。权益时长与链接有效期是两件事：前者是注册后能用多久，后者是这封邀请多久内可用。
          </Typography.Text>
        </Form>

        {result && (result.skipped.length > 0 || result.failed.length > 0) && (
          <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
            {result.sent.length > 0 && (
              <Alert type="success" showIcon message={`已发出 ${result.sent.length} 封：${result.sent.join("、")}`} />
            )}
            {result.skipped.length > 0 && (
              <Alert
                type="warning"
                showIcon
                message="以下邮箱已跳过"
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {result.skipped.map((s) => (
                      <li key={`${s.email}-${s.reason}`}>
                        {s.email} —— {SKIP_LABEL[s.reason] ?? s.reason}
                      </li>
                    ))}
                  </ul>
                }
              />
            )}
            {result.failed.length > 0 && (
              <Alert
                type="error"
                showIcon
                message="以下邮箱发送失败"
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {result.failed.map((f) => (
                      <li key={f.email}>
                        {f.email} —— {f.reason}
                      </li>
                    ))}
                  </ul>
                }
              />
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
