"use client";

import { Popover, Typography, Space, Button } from "antd";
import { WechatOutlined, MailOutlined, CustomerServiceOutlined } from "@ant-design/icons";
import type { FounderContact as FounderContactData } from "@/lib/platform-settings";
import { BRAND } from "@/lib/theme/brand";

// 联系方式由 super-admin 端「平台设置 → 联系创始人配置」维护（platform_settings 表）。
// 任意字段留空则对应展示自动隐藏；三项全空则整个入口不渲染。

function WechatPanel({ wechatId, wechatQrUrl }: { wechatId: string; wechatQrUrl: string }) {
  return (
    <div style={{ display: "grid", placeItems: "center", gap: 8, width: 176 }}>
      {wechatQrUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={wechatQrUrl} alt="创始人微信二维码" width={140} height={140} style={{ objectFit: "contain" }} />
      ) : (
        <div style={{ display: "grid", placeItems: "center", width: 140, height: 140,
          border: "1px dashed #c7d3e0", borderRadius: 8, color: "#98a6b6", fontSize: 12,
          textAlign: "center", padding: 8 }}>
          未配置二维码
        </div>
      )}
      {wechatId && (
        <Typography.Text copyable={{ text: wechatId }} style={{ fontSize: 12 }}>
          微信号: {wechatId}
        </Typography.Text>
      )}
    </div>
  );
}

function buildContent({ wechatId, wechatQrUrl, email }: FounderContactData) {
  const hasWechat = Boolean(wechatId || wechatQrUrl);
  return (
    <div style={{ maxWidth: 220 }}>
      <Typography.Paragraph style={{ marginBottom: 12, fontSize: 13 }}>
        遇到问题？直接联系创始人，24 小时内回复。
      </Typography.Paragraph>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        {hasWechat && (
          <div>
            <Typography.Text strong style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
              <WechatOutlined style={{ color: "#07c160", marginInlineEnd: 6 }} />微信
            </Typography.Text>
            <WechatPanel wechatId={wechatId} wechatQrUrl={wechatQrUrl} />
          </div>
        )}
        {email && (
          <Button block icon={<MailOutlined />} href={`mailto:${email}`}>
            发邮件
          </Button>
        )}
      </Space>
    </div>
  );
}

export function FounderContact({
  collapsed,
  contact,
}: {
  collapsed: boolean;
  contact: FounderContactData;
}) {
  // 未配置任何联系方式则不展示入口，避免弹出空面板。
  if (!contact.wechatId && !contact.wechatQrUrl && !contact.email) return null;

  return (
    <div style={{ marginBlockStart: "auto", padding: collapsed ? "12px 0" : "12px 16px",
      borderBlockStart: "1px solid #eef3f9" }}>
      <Popover content={buildContent(contact)} trigger="click" placement="rightTop">
        {collapsed ? (
          <Button type="text" block icon={<CustomerServiceOutlined style={{ color: BRAND }} />} />
        ) : (
          <Button type="text" block style={{ height: "auto", padding: "8px 10px", textAlign: "start" }}>
            <Space size={8}>
              <CustomerServiceOutlined style={{ color: BRAND }} />
              <span style={{ fontSize: 13 }}>联系创始人</span>
            </Space>
          </Button>
        )}
      </Popover>
    </div>
  );
}
