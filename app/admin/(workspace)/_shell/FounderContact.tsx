"use client";

import { Popover, Typography, Space, Button } from "antd";
import { WechatOutlined, MailOutlined, CustomerServiceOutlined } from "@ant-design/icons";
import type { FounderContact as FounderContactData } from "@/lib/platform-settings";
import { BRAND } from "@/lib/theme/brand";
import { useAdminT } from "@/lib/i18n/admin/context";

// 联系方式由 super-admin 端「平台设置 → 联系创始人配置」维护（platform_settings 表）。
// 任意字段留空则对应展示自动隐藏；三项全空则整个入口不渲染。

function WechatPanel({ wechatId, wechatQrUrl }: { wechatId: string; wechatQrUrl: string }) {
  const t = useAdminT().shell.founderContact;
  return (
    <div style={{ display: "grid", placeItems: "center", gap: 8, width: 176 }}>
      {wechatQrUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={wechatQrUrl} alt={t.wechatQrAlt} width={140} height={140} style={{ objectFit: "contain" }} />
      ) : (
        <div style={{ display: "grid", placeItems: "center", width: 140, height: 140,
          border: "1px dashed #c7d3e0", borderRadius: 8, color: "#98a6b6", fontSize: 12,
          textAlign: "center", padding: 8 }}>
          {t.noQr}
        </div>
      )}
      {wechatId && (
        <Typography.Text copyable={{ text: wechatId }} style={{ fontSize: 12 }}>
          {t.wechatId(wechatId)}
        </Typography.Text>
      )}
    </div>
  );
}

function ContactPanel({ wechatId, wechatQrUrl, email }: FounderContactData) {
  const t = useAdminT().shell.founderContact;
  const hasWechat = Boolean(wechatId || wechatQrUrl);
  return (
    <div style={{ maxWidth: 220 }}>
      <Typography.Paragraph style={{ marginBottom: 12, fontSize: 13 }}>
        {t.intro}
      </Typography.Paragraph>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        {hasWechat && (
          <div>
            <Typography.Text strong style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
              <WechatOutlined style={{ color: "#07c160", marginInlineEnd: 6 }} />{t.wechat}
            </Typography.Text>
            <WechatPanel wechatId={wechatId} wechatQrUrl={wechatQrUrl} />
          </div>
        )}
        {email && (
          <Button block icon={<MailOutlined />} href={`mailto:${email}`}>
            {t.email}
          </Button>
        )}
      </Space>
    </div>
  );
}

export function FounderContact({ contact }: { contact: FounderContactData }) {
  const tooltip = useAdminT().shell.founderContact.tooltip;
  // 未配置任何联系方式则不展示入口，避免弹出空面板。
  if (!contact.wechatId && !contact.wechatQrUrl && !contact.email) return null;

  return (
    <Popover content={<ContactPanel {...contact} />} trigger="click" placement="bottomRight">
      <Button type="text" icon={<CustomerServiceOutlined style={{ color: BRAND }} />} title={tooltip} />
    </Popover>
  );
}
