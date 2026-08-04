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
import { PLANS, type PlanId } from "@/lib/plans";

type Provider = "meta" | "tiktok";

interface AccountCredential {
  provider: Provider;
  externalId: string;
}

const PROVIDER_META: Record<Provider, { label: string; idLabel: string; idHint: string }> = {
  meta: { label: "Meta", idLabel: "Dataset ID", idHint: "如 1234567890" },
  tiktok: { label: "TikTok", idLabel: "Pixel Code", idHint: "如 CXXXXXXXX" },
};

interface FormValues { provider: Provider; externalId: string; accessToken: string }

export function CapiCredentials() {
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
      if (!res.ok) { message.error("保存失败，请检查填写内容"); return; }
      message.success("已保存，未单独覆盖的页都会用这份凭据");
      setOpen(false);
      void mutate();
    } finally {
      setSaving(false);
    }
  }

  async function remove(provider: Provider) {
    await fetch(`${ApiRoutes.CapiAccountCredentials}?provider=${provider}`, { method: "DELETE" });
    message.success("已删除");
    void mutate();
  }

  const configured = new Map(rows.map((r) => [r.provider, r]));

  return (
    <Card
      title="服务端转化回传（CAPI）"
      extra={<Typography.Text type="secondary" style={{ fontSize: 12 }}>账号级默认凭据</Typography.Text>}
    >
      {!advanced ? (
        <Typography.Text type="secondary">
          服务端回传为 Pro 及以上套餐权益。它把表单转化从服务端直接送回平台，
          补上被浏览器拦截插件吃掉的那部分转化。
        </Typography.Text>
      ) : (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            这里配一次，名下所有落地页都会用它回传；某张页要用别的 Dataset，
            在该页编辑器的「追踪与转化」里单独覆盖即可。
          </Typography.Text>
          <Table<{ provider: Provider }>
            rowKey="provider"
            size="small"
            loading={isLoading}
            pagination={false}
            dataSource={(Object.keys(PROVIDER_META) as Provider[]).map((provider) => ({ provider }))}
            columns={[
              { title: "平台", dataIndex: "provider", width: 120, render: (p: Provider) => PROVIDER_META[p].label },
              {
                title: "状态", width: 200,
                render: (_: unknown, r) => {
                  const cur = configured.get(r.provider);
                  return cur
                    ? <Space size={6}><Tag color="green">已配置</Tag><Typography.Text code>{cur.externalId}</Typography.Text></Space>
                    : <Tag>未配置</Tag>;
                },
              },
              {
                title: "操作", width: 160,
                render: (_: unknown, r) => {
                  const cur = configured.get(r.provider);
                  return (
                    <Space size="middle">
                      <a onClick={() => openFor(r.provider, cur?.externalId)}>{cur ? "更新" : "配置"}</a>
                      {cur && (
                        <Popconfirm
                          title="删除后这些页将停止服务端回传"
                          okText="删除"
                          okButtonProps={{ danger: true }}
                          onConfirm={() => remove(r.provider)}
                        >
                          <a>删除</a>
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
        title="配置账号级回传凭据"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={save}
        confirmLoading={saving}
        okText="保存"
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
                  <Form.Item label={meta.idLabel} name="externalId" rules={[{ required: true, message: `请填写 ${meta.idLabel}` }]}>
                    <Input placeholder={meta.idHint} />
                  </Form.Item>
                  <Form.Item
                    label="Access Token"
                    name="accessToken"
                    rules={[{ required: true, message: "请粘贴 Access Token" }]}
                    extra="出于安全考虑不回显已存的 token，更新时请重新粘贴。"
                  >
                    <Input.Password placeholder="粘贴 Access Token" />
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
