"use client";
// 账号级经营主体信息（页脚公司信息 / 执照）。
//
// 放在设置里而不是编辑器里：它属于账号，一份可被多张页引用，改一次全站生效。
// 编辑器页脚面板只负责「这张页用哪一份」。
//
// 为什么要有这个功能：TikTok 对电商与金融类落地页明确要求页脚展示公司信息与
// 执照，Meta / LinkedIn 的「真实身份」也吃这一项。平台无从代填，编造更糟，
// 故只提供录入位置 + 发布前的非阻断提示。

import { useState } from "react";
import useSWR from "swr";
import { Card, Button, Space, Typography, Table, Modal, Form, Input, Switch, Tag, message } from "antd";
import { ApiRoutes } from "@/lib/constants";
import { useAdminT } from "@/lib/i18n/admin/context";
import { formatCompanyInfo } from "@/lib/company-profiles/format";

interface ProfileRow {
  id: string;
  label: string;
  legal_name: string;
  address: string;
  registration_no: string;
  license: string;
  is_default: boolean;
}

type FormValues = Omit<ProfileRow, "id">;

const EMPTY: FormValues = {
  label: "",
  legal_name: "",
  address: "",
  registration_no: "",
  license: "",
  is_default: false,
};

export function CompanyProfiles() {
  const t = useAdminT().settings.companyProfiles;
  const { data, isLoading, mutate } = useSWR<ProfileRow[]>(ApiRoutes.CompanyProfiles, (url: string) =>
    fetch(url).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }),
  );
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const rows = data ?? [];

  function openNew() {
    setEditing(null);
    form.setFieldsValue(EMPTY);
    setOpen(true);
  }

  function openEdit(row: ProfileRow) {
    setEditing(row);
    form.setFieldsValue(row);
    setOpen(true);
  }

  async function submit() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const res = await fetch(
        editing ? `${ApiRoutes.CompanyProfiles}/${editing.id}` : ApiRoutes.CompanyProfiles,
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      if (!res.ok) throw new Error();
      await mutate();
      setOpen(false);
      message.success(t.saved);
    } catch {
      message.error(t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: ProfileRow) {
    const res = await fetch(`${ApiRoutes.CompanyProfiles}/${row.id}`, { method: "DELETE" });
    if (res.status === 409) {
      // 仍被落地页引用：直接删会让那些页的页脚当场少掉公司信息，而它们可能正在投放。
      const json = await res.json().catch(() => null);
      message.warning(t.inUse(String(json?.pages ?? "")));
      return;
    }
    if (!res.ok) {
      message.error(t.deleteFailed);
      return;
    }
    await mutate();
    message.success(t.deleted);
  }

  return (
    <Card
      title={t.title}
      extra={<Button type="primary" size="small" onClick={openNew}>{t.add}</Button>}
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        {t.description}
      </Typography.Paragraph>
      <Table<ProfileRow>
        rowKey="id"
        size="small"
        loading={isLoading}
        pagination={false}
        dataSource={rows}
        locale={{ emptyText: t.empty }}
        columns={[
          {
            title: t.columns.name,
            dataIndex: "label",
            render: (label: string, r) => (
              <Space size={6}>
                <span>{label}</span>
                {r.is_default && <Tag color="blue">{t.defaultTag}</Tag>}
              </Space>
            ),
          },
          {
            title: t.columns.footerPreview,
            render: (_: unknown, r) => (
              <Typography.Text type="secondary">{formatCompanyInfo(r)}</Typography.Text>
            ),
          },
          {
            title: t.columns.actions,
            width: 120,
            render: (_: unknown, r) => (
              <Space size="small">
                <Button type="link" size="small" onClick={() => openEdit(r)}>{t.edit}</Button>
                <Button type="link" size="small" danger onClick={() => void remove(r)}>{t.delete}</Button>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? t.editTitle : t.newTitle}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => void submit()}
        confirmLoading={saving}
        okText={t.save}
        cancelText={t.cancel}
      >
        <Form form={form} layout="vertical" initialValues={EMPTY}>
          <Form.Item name="label" label={t.fields.label} extra={t.fields.labelExtra}>
            <Input placeholder={t.fields.labelPlaceholder} />
          </Form.Item>
          <Form.Item
            name="legal_name"
            label={t.fields.legalName}
            rules={[{ required: true, message: t.fields.legalNameRequired }]}
          >
            <Input placeholder="Acme Aesthetics Ltd" />
          </Form.Item>
          <Form.Item name="address" label={t.fields.address}>
            <Input placeholder="12 King Street, London W1" />
          </Form.Item>
          <Form.Item name="registration_no" label={t.fields.registrationNo}>
            <Input placeholder="12345678" />
          </Form.Item>
          <Form.Item name="license" label={t.fields.license} extra={t.fields.licenseExtra}>
            <Input placeholder="HCA-2291" />
          </Form.Item>
          <Form.Item name="is_default" label={t.fields.isDefault} valuePropName="checked" extra={t.fields.isDefaultExtra}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
