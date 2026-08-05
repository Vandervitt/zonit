"use client";
// 账号级服务端回传（CAPI）凭据。
//
// 放在设置里而不是只留在编辑器：同一个广告主的多张页共用一个 Dataset，
// 原来只有页级凭据时，同一份 token 要在每张页各贴一遍，换期还得逐页改回来。
// 编辑器里的页级配置保留为「这张页要用别的 Dataset」的覆盖入口（代投给不同
// 客户建页时用得上）。解析顺序见 lib/capi/credentials.ts。

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Card, Space, Typography, Table, Modal, Form, Input, Tag, Popconfirm, App } from "antd";
import { ApiRoutes } from "@/lib/constants";
import { useAdminT } from "@/lib/i18n/admin/context";
import { PLANS, type PlanId } from "@/lib/plans";

type Provider = "meta" | "tiktok";

interface AccountCredential {
  provider: Provider;
  externalId: string;
}

// 平台名与字段名是各平台的官方术语，不翻译；只有「如 …」这个示例前缀随界面语言变
// （见字典的 settings.capi.idExample）。
const PROVIDER_META: Record<Provider, { label: string; idLabel: string; idSample: string }> = {
  meta: { label: "Meta", idLabel: "Dataset ID", idSample: "1234567890" },
  tiktok: { label: "TikTok", idLabel: "Pixel Code", idSample: "CXXXXXXXX" },
};

interface FormValues { provider: Provider; externalId: string; accessToken: string }

export function CapiCredentials() {
  const t = useAdminT().settings.capi;
  const { message } = App.useApp();
  const { data: session } = useSession();
  const plan = (session?.user?.plan ?? "free") as PlanId;
  const advanced = PLANS[plan].advancedTracking;

  const { data, isLoading, mutate } = useSWR<AccountCredential[]>(
    advanced ? ApiRoutes.CapiAccountCredentials : null,
    (url: string) => fetch(url).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }),
  );
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const rows = data ?? [];

  function openFor(provider: Provider, externalId = "") {
    // token 不回显：库里存的是明文凭据，回显等于把它送回浏览器。改期一律重填。
    form.setFieldsValue({ provider, externalId, accessToken: "" });
    setOpen(true);
  }

  async function save() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const res = await fetch(ApiRoutes.CapiAccountCredentials, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) { message.error(t.saveFailed); return; }
      message.success(t.saved);
      setOpen(false);
      void mutate();
    } finally {
      setSaving(false);
    }
  }

  async function remove(provider: Provider) {
    await fetch(`${ApiRoutes.CapiAccountCredentials}?provider=${provider}`, { method: "DELETE" });
    message.success(t.deleted);
    void mutate();
  }

  const configured = new Map(rows.map((r) => [r.provider, r]));

  return (
    <Card
      title={t.title}
      extra={<Typography.Text type="secondary" style={{ fontSize: 12 }}>{t.subtitle}</Typography.Text>}
    >
      {!advanced ? (
        <Typography.Text type="secondary">
          {t.upsell}
        </Typography.Text>
      ) : (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t.description}
          </Typography.Text>
          <Table<{ provider: Provider }>
            rowKey="provider"
            size="small"
            loading={isLoading}
            pagination={false}
            dataSource={(Object.keys(PROVIDER_META) as Provider[]).map((provider) => ({ provider }))}
            columns={[
              { title: t.columns.provider, dataIndex: "provider", width: 120, render: (p: Provider) => PROVIDER_META[p].label },
              {
                title: t.columns.status, width: 200,
                render: (_: unknown, r) => {
                  const cur = configured.get(r.provider);
                  return cur
                    ? <Space size={6}><Tag color="green">{t.configured}</Tag><Typography.Text code>{cur.externalId}</Typography.Text></Space>
                    : <Tag>{t.notConfigured}</Tag>;
                },
              },
              {
                title: t.columns.actions, width: 160,
                render: (_: unknown, r) => {
                  const cur = configured.get(r.provider);
                  return (
                    <Space size="middle">
                      <a onClick={() => openFor(r.provider, cur?.externalId)}>{cur ? t.update : t.configure}</a>
                      {cur && (
                        <Popconfirm
                          title={t.deleteConfirm}
                          okText={t.delete}
                          okButtonProps={{ danger: true }}
                          onConfirm={() => remove(r.provider)}
                        >
                          <a>{t.delete}</a>
                        </Popconfirm>
                      )}
                    </Space>
                  );
                },
              },
            ]}
          />
        </Space>
      )}

      <Modal
        title={t.dialogTitle}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={save}
        confirmLoading={saving}
        okText={t.save}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="provider" hidden><Input /></Form.Item>
          <Form.Item noStyle shouldUpdate>
            {() => {
              const provider = (form.getFieldValue("provider") ?? "meta") as Provider;
              const meta = PROVIDER_META[provider];
              return (
                <>
                  <Form.Item label={meta.idLabel} name="externalId" rules={[{ required: true, message: t.idRequired(meta.idLabel) }]}>
                    <Input placeholder={t.idExample(meta.idSample)} />
                  </Form.Item>
                  <Form.Item
                    label="Access Token"
                    name="accessToken"
                    rules={[{ required: true, message: t.tokenRequired }]}
                    extra={t.tokenExtra}
                  >
                    <Input.Password placeholder={t.tokenPlaceholder} />
                  </Form.Item>
                </>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
