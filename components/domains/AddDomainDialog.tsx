"use client";

import { useState } from "react";
import { Modal, Form, Input, Button, Typography, App, Alert } from "antd";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";
import { ApiRoutes } from "@/lib/constants";
import { isMainlandChinaDomain, normalizeDomain } from "@/lib/domain";
import type { DnsRecord } from "@/lib/vercel";
import { jsonRequest, ApiError } from "@/lib/api/fetcher";
import { useMutation } from "@/lib/api/use-mutation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

const DOMAIN_ERROR_MAP: Record<string, string> = {
  invalid_domain: "域名格式不正确",
  domain_tld_blocked: "暂不支持中国大陆管辖域名（如 .cn），其解析受备案与注册局政策影响，请使用 .com / .net 等国际域名",
  domain_taken: "该域名已被其他账号绑定",
  vercel_api_error: "Vercel API 调用失败，请稍后重试",
  limit_exceeded: "已达到当前套餐的域名数量上限，请升级套餐或先禁用一个已有域名",
};

function mapDomainError(err: ApiError): string {
  return (err.code && DOMAIN_ERROR_MAP[err.code]) || "添加失败，请重试";
}

export function AddDomainDialog({ open, onOpenChange, onAdded }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ domain: string }>();
  const [records, setRecords] = useState<DnsRecord[] | null>(null);
  const [mainlandNs, setMainlandNs] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const addMutation = useMutation(
    (payload: { domain: string }) =>
      jsonRequest<{ records: DnsRecord[]; mainlandNs?: string | null }>(ApiRoutes.Domains, "POST", payload),
    {
      errorToast: false,
      throwOnError: true,
      onSuccess: ({ records: newRecords, mainlandNs: ns }) => {
        setRecords(newRecords ?? []);
        setMainlandNs(ns ?? null);
        onAdded();
      },
    },
  );

  function reset() {
    form.resetFields();
    setRecords(null);
    setMainlandNs(null);
    setCopiedValue(null);
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
    try {
      await addMutation.trigger({ domain });
    } catch (err) {
      message.error(mapDomainError(err as ApiError));
    }
  }

  function handleCopy(value: string) {
    navigator.clipboard.writeText(value);
    setCopiedValue(value);
    setTimeout(() => setCopiedValue(null), 2000);
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
      {!records ? (
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
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const normalized = normalizeDomain(value);
                    if (!normalized) {
                      return Promise.reject(new Error(DOMAIN_ERROR_MAP.invalid_domain));
                    }
                    if (isMainlandChinaDomain(normalized)) {
                      return Promise.reject(new Error(DOMAIN_ERROR_MAP.domain_tld_blocked));
                    }
                    return Promise.resolve();
                  },
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
            域名已添加。请前往你的 DNS 服务商（Cloudflare / AWS Route53 / Namecheap 等）添加以下记录，Vercel 将在 DNS 生效后自动签发 SSL 证书。
          </Typography.Paragraph>
          {mainlandNs ? (
            <Alert
              type="warning"
              showIcon
              message="检测到该域名使用中国大陆 DNS 服务商"
              description={`当前 NS 属于 ${mainlandNs}。域名本身可正常使用，但受大陆监管政策影响（如实名/备案要求变化），存在被服务商暂停解析的风险。做海外投放建议将 DNS 迁移到 Cloudflare 等海外服务商，或至少知晓此风险。`}
            />
          ) : null}
          {records.map((record, i) => (
            <div
              key={`${record.type}-${record.name}-${i}`}
              style={{ border: "1px solid #d9d9d9", borderRadius: 8, padding: 16, background: "#fafafa" }}
            >
              <div style={{ marginBottom: 12 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>类型</Typography.Text>
                <div><Typography.Text code>{record.type}</Typography.Text></div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>名称</Typography.Text>
                <div><Typography.Text code>{record.name}</Typography.Text></div>
              </div>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>值</Typography.Text>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Typography.Text code style={{ flex: 1, wordBreak: "break-all" }}>{record.value}</Typography.Text>
                  <Button
                    type="text"
                    size="small"
                    icon={copiedValue === record.value ? <CheckOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
                    onClick={() => handleCopy(record.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
            ⚠️ 顶级域名（如 example.com）用 A 记录，子域名（如 www.example.com）用 CNAME。如使用 Cloudflare，请将代理状态设为「仅 DNS」（灰色云朵），否则会阻断证书签发。
          </Typography.Paragraph>
          <Button block onClick={handleClose}>
            完成
          </Button>
        </div>
      )}
    </Modal>
  );
}
