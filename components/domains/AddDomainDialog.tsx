"use client";

import { useState } from "react";
import { Modal, Form, Input, Button, Typography, App } from "antd";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";
import { ApiRoutes } from "@/lib/constants";
import { normalizeDomain } from "@/lib/domain";
import { jsonRequest, ApiError } from "@/lib/api/fetcher";
import { useMutation } from "@/lib/api/use-mutation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

const DOMAIN_ERROR_MAP: Record<string, string> = {
  invalid_domain: "域名格式不正确",
  domain_taken: "该域名已被其他账号绑定",
  vercel_api_error: "Vercel API 调用失败，请稍后重试",
};

function mapDomainError(err: ApiError): string {
  return (err.code && DOMAIN_ERROR_MAP[err.code]) || "添加失败，请重试";
}

export function AddDomainDialog({ open, onOpenChange, onAdded }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ domain: string }>();
  const [cname, setCname] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const addMutation = useMutation(
    (payload: { domain: string }) =>
      jsonRequest<{ cname: string }>(ApiRoutes.Domains, "POST", payload),
    {
      errorToast: false,
      onSuccess: ({ cname: newCname }) => {
        setCname(newCname);
        onAdded();
      },
    },
  );

  function reset() {
    form.resetFields();
    setCname(null);
    setCopied(false);
    addMutation.reset();
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  async function handleFinish(values: { domain: string }) {
    // Field validator已保证可归一化为合法主机名
    const domain = normalizeDomain(values.domain);
    if (!domain) return;
    form.setFieldValue("domain", domain);
    try {
      await addMutation.trigger({ domain });
    } catch (err) {
      message.error(mapDomainError(err as ApiError));
    }
  }

  function handleCopy(domainValue: string) {
    if (!cname) return;
    navigator.clipboard.writeText(cname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const loading = addMutation.isMutating;
  const domainValue = Form.useWatch("domain", form) ?? "";

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title="添加自定义域名"
      footer={null}
      destroyOnHidden
    >
      {!cname ? (
        <>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            绑定你自己的域名，用户访问时地址栏显示你的品牌域名。
          </Typography.Paragraph>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
          >
            <Form.Item
              name="domain"
              label="域名"
              rules={[
                { required: true, message: "请输入域名" },
                {
                  validator: (_, value) =>
                    !value || normalizeDomain(value)
                      ? Promise.resolve()
                      : Promise.reject(new Error(DOMAIN_ERROR_MAP.invalid_domain)),
                },
              ]}
            >
              <Input
                placeholder="example.com 或 www.example.com"
                onChange={(e) => {
                  form.setFieldValue("domain", e.target.value.trim().toLowerCase());
                }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={!domainValue}
                block
              >
                {loading ? "添加中…" : "添加域名"}
              </Button>
            </Form.Item>
          </Form>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            域名已添加。请前往你的 DNS 服务商（Cloudflare）添加以下 CNAME 记录，Vercel 将在 DNS 生效后自动签发 SSL 证书。
          </Typography.Paragraph>
          <div style={{ border: "1px solid #d9d9d9", borderRadius: 8, padding: 16, background: "#fafafa" }}>
            <div style={{ marginBottom: 12 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>类型</Typography.Text>
              <div><Typography.Text code>CNAME</Typography.Text></div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>名称</Typography.Text>
              <div>
                <Typography.Text code>
                  {domainValue.startsWith("www.") ? "www" : domainValue}
                </Typography.Text>
              </div>
            </div>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>值</Typography.Text>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Typography.Text code style={{ flex: 1 }}>{cname}</Typography.Text>
                <Button
                  type="text"
                  size="small"
                  icon={copied ? <CheckOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
                  onClick={() => handleCopy(domainValue)}
                />
              </div>
            </div>
          </div>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
            ⚠️ 如使用 Cloudflare，顶级域名（如 example.com）请将代理状态设为「仅 DNS」（灰色云朵），子域名（如 www.example.com）则无此限制。
          </Typography.Paragraph>
          <Button block onClick={handleClose}>
            完成
          </Button>
        </div>
      )}
    </Modal>
  );
}
