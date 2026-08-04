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
      message.success("已保存");
    } catch {
      message.error("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: ProfileRow) {
    const res = await fetch(`${ApiRoutes.CompanyProfiles}/${row.id}`, { method: "DELETE" });
    if (res.status === 409) {
      // 仍被落地页引用：直接删会让那些页的页脚当场少掉公司信息，而它们可能正在投放。
      const json = await res.json().catch(() => null);
      message.warning(`还有 ${json?.pages ?? ""} 张落地页在用这份主体信息，请先在页面里换成其他主体。`);
      return;
    }
    if (!res.ok) {
      message.error("删除失败，请重试");
      return;
    }
    await mutate();
    message.success("已删除");
  }

  return (
    <Card
      title="经营主体信息"
      extra={<Button type="primary" size="small" onClick={openNew}>新增主体</Button>}
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        落地页页脚展示的公司信息。TikTok 对电商与金融类页面要求页脚展示经营主体与执照，
        Meta / LinkedIn 也会核对页面身份是否真实。可建多份（不同实体或不同市场各一份），
        在编辑器的页脚面板里为每张页选用；改动会立即反映到所有引用它的已发布页。
      </Typography.Paragraph>
      <Table<ProfileRow>
        rowKey="id"
        size="small"
        loading={isLoading}
        pagination={false}
        dataSource={rows}
        locale={{ emptyText: "还没有主体信息。填一份，页脚与政策页就会展示它。" }}
        columns={[
          {
            title: "名称",
            dataIndex: "label",
            render: (label: string, r) => (
              <Space size={6}>
                <span>{label}</span>
                {r.is_default && <Tag color="blue">默认</Tag>}
              </Space>
            ),
          },
          {
            title: "页脚展示效果",
            render: (_: unknown, r) => (
              <Typography.Text type="secondary">{formatCompanyInfo(r)}</Typography.Text>
            ),
          },
          {
            title: "操作",
            width: 120,
            render: (_: unknown, r) => (
              <Space size="small">
                <Button type="link" size="small" onClick={() => openEdit(r)}>编辑</Button>
                <Button type="link" size="small" danger onClick={() => void remove(r)}>删除</Button>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? "编辑经营主体" : "新增经营主体"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => void submit()}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" initialValues={EMPTY}>
          <Form.Item name="label" label="内部名称" extra="只在后台用于区分多份主体，不会出现在落地页上">
            <Input placeholder="如：英国实体" />
          </Form.Item>
          <Form.Item
            name="legal_name"
            label="法律实体名"
            rules={[{ required: true, message: "请填写法律实体名" }]}
          >
            <Input placeholder="Acme Aesthetics Ltd" />
          </Form.Item>
          <Form.Item name="address" label="经营地址">
            <Input placeholder="12 King Street, London W1" />
          </Form.Item>
          <Form.Item name="registration_no" label="公司注册号">
            <Input placeholder="12345678" />
          </Form.Item>
          <Form.Item name="license" label="行业执照 / 许可证编号" extra="医疗、金融、法律等高监管行业按平台要求展示">
            <Input placeholder="HCA-2291" />
          </Form.Item>
          <Form.Item name="is_default" label="设为默认" valuePropName="checked" extra="新建落地页时预选这一份">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
