"use client";

import { useRouter } from "next/navigation";
import { Modal, Button, Typography } from "antd";
import { Routes } from "@/lib/constants";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanId;
}

const UPGRADE_TARGET: Record<PlanId, PlanId | null> = {
  free: "starter",
  starter: "pro",
  pro: "agency",
  agency: null,
};

export function UpgradeDialog({ open, onOpenChange, currentPlan }: Props) {
  const router = useRouter();
  const targetPlan = UPGRADE_TARGET[currentPlan];

  if (!targetPlan) return null;

  const current = PLANS[currentPlan];
  const target = PLANS[targetPlan];

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="已达到落地页上限"
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>
          稍后再说
        </Button>,
        <Button
          key="upgrade"
          type="primary"
          onClick={() => {
            onOpenChange(false);
            router.push(Routes.Billing);
          }}
        >
          查看 {target.label} 套餐 · {target.priceText}
        </Button>,
      ]}
    >
      <Typography.Paragraph type="secondary">
        {current.label} 套餐最多创建 {current.landingPagesLimit} 张落地页。升级到{" "}
        <Typography.Text strong>{target.label}</Typography.Text> 即可最多管理{" "}
        {target.landingPagesLimit === Infinity ? "无限张" : `${target.landingPagesLimit} 张`}落地页。
      </Typography.Paragraph>

      <div style={{ border: "1px solid #e6f4ff", borderRadius: 8, background: "#f0f9ff", padding: 16 }}>
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
          升级后还可获得：
        </Typography.Text>
        {current.hasWatermark && !target.hasWatermark && (
          <Typography.Text style={{ display: "block" }}>✓ 去除品牌水印</Typography.Text>
        )}
        {target.domainsLimit > current.domainsLimit && (
          <Typography.Text style={{ display: "block" }}>
            ✓ 绑定最多 {target.domainsLimit === Infinity ? "无限个" : target.domainsLimit} 个自定义域名
          </Typography.Text>
        )}
        {target.allTemplates && !current.allTemplates && (
          <Typography.Text style={{ display: "block" }}>✓ 解锁全部 15+ 行业模板</Typography.Text>
        )}
      </div>
    </Modal>
  );
}
