"use client";

import { useState } from "react";
import { Modal, Form, Input, Button, Typography, App, Alert } from "antd";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";
import { ApiRoutes } from "@/lib/constants";
import { isMainlandChinaDomain, normalizeDomain } from "@/lib/domain";
import type { DnsRecord } from "@/lib/vercel";
import { jsonRequest, ApiError } from "@/lib/api/fetcher";
import { useMutation } from "@/lib/api/use-mutation";
import { useAdminT } from "@/lib/i18n/admin/context";
import type { AdminDictionary } from "@/lib/i18n/admin";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

type DomainErrors = AdminDictionary["domains"]["addDialog"]["errors"];

/** 后端错误码 → 文案。未知错误码走 fallback，不把原始 code 抛给用户。 */
function mapDomainError(err: ApiError, errors: DomainErrors): string {
  const known = err.code && err.code in errors ? errors[err.code as keyof DomainErrors] : null;
  return typeof known === "string" ? known : errors.fallback;
}

export function AddDomainDialog({ open, onOpenChange, onAdded }: Props) {
  const { message } = App.useApp();
  const t = useAdminT().domains.addDialog;
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
      message.error(mapDomainError(err as ApiError, t.errors));
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
      title={t.title}
      footer={null}
      destroyOnHidden
    >
      {!records ? (
        <>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            {t.intro}
          </Typography.Paragraph>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={t.vercelTip.message}
            description={
              <>
                {t.vercelTip.body[0]}
                <Typography.Link href="https://vercel.com/domains" target="_blank" rel="noopener noreferrer">
                  {t.vercelTip.linkText}
                </Typography.Link>
                {t.vercelTip.body[1]}
              </>
            }
          />
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
          >
            <Form.Item
              name="domain"
              label={t.label}
              rules={[
                { required: true, message: t.required },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const normalized = normalizeDomain(value);
                    if (!normalized) {
                      return Promise.reject(new Error(t.errors.invalid_domain));
                    }
                    if (isMainlandChinaDomain(normalized)) {
                      return Promise.reject(new Error(t.errors.domain_tld_blocked));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
                placeholder={t.placeholder}
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
                {loading ? t.submitting : t.submit}
              </Button>
            </Form.Item>
          </Form>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {t.recordsIntro}
          </Typography.Paragraph>
          {mainlandNs ? (
            <Alert
              type="warning"
              showIcon
              message={t.mainlandNs.message}
              description={t.mainlandNs.description(mainlandNs)}
            />
          ) : null}
          {records.map((record, i) => (
            <div
              key={`${record.type}-${record.name}-${i}`}
              style={{ border: "1px solid #d9d9d9", borderRadius: 8, padding: 16, background: "#fafafa" }}
            >
              <div style={{ marginBottom: 12 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t.record.type}</Typography.Text>
                <div><Typography.Text code>{record.type}</Typography.Text></div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t.record.name}</Typography.Text>
                <div><Typography.Text code>{record.name}</Typography.Text></div>
              </div>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t.record.value}</Typography.Text>
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
            {t.recordHint}
          </Typography.Paragraph>
          <Button block onClick={handleClose}>
            {t.done}
          </Button>
        </div>
      )}
    </Modal>
  );
}
