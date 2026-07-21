"use client";

import { Popover, Typography, Space, Button } from "antd";
import { WechatOutlined, MailOutlined, CustomerServiceOutlined } from "@ant-design/icons";
import { BRAND } from "@/lib/theme/brand";

// TODO(占位): 上线前替换为真实联系方式。
// - 微信: 把 WECHAT_ID 换成真实微信号; 把二维码图放到 public/ 下并把 WECHAT_QR_SRC 指向它 (如 "/founder-wechat-qr.png")。
// - 邮箱: 把 EMAIL 换成对外公开的收信邮箱。
const WECHAT_ID = "TODO-wechat-id";
const WECHAT_QR_SRC = ""; // 占位: 为空时展示占位方块; 有图后填图片路径。
const EMAIL = "support@zapbridge.tech";

function WechatPanel() {
  return (
    <div style={{ display: "grid", placeItems: "center", gap: 8, width: 176 }}>
      {WECHAT_QR_SRC ? (
        <img src={WECHAT_QR_SRC} alt="创始人微信二维码" width={140} height={140} />
      ) : (
        <div style={{ display: "grid", placeItems: "center", width: 140, height: 140,
          border: "1px dashed #c7d3e0", borderRadius: 8, color: "#98a6b6", fontSize: 12,
          textAlign: "center", padding: 8 }}>
          微信二维码<br />(占位)
        </div>
      )}
      <Typography.Text copyable={{ text: WECHAT_ID }} style={{ fontSize: 12 }}>
        微信号: {WECHAT_ID}
      </Typography.Text>
    </div>
  );
}

const contactContent = (
  <div style={{ maxWidth: 220 }}>
    <Typography.Paragraph style={{ marginBottom: 12, fontSize: 13 }}>
      遇到问题？直接联系创始人，24 小时内回复。
    </Typography.Paragraph>
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <div>
        <Typography.Text strong style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
          <WechatOutlined style={{ color: "#07c160", marginInlineEnd: 6 }} />微信
        </Typography.Text>
        <WechatPanel />
      </div>
      <Button block icon={<MailOutlined />} href={`mailto:${EMAIL}`}>
        发邮件
      </Button>
    </Space>
  </div>
);

export function FounderContact({ collapsed }: { collapsed: boolean }) {
  return (
    <div style={{ marginBlockStart: "auto", padding: collapsed ? "12px 0" : "12px 16px",
      borderBlockStart: "1px solid #eef3f9" }}>
      <Popover content={contactContent} trigger="click" placement="rightTop">
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
