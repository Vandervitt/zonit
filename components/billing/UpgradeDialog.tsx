"use client";

import { useRouter } from "next/navigation";
import { Modal, Button, Typography } from "antd";
import { Routes } from "@/lib/constants";
import { PLANS, planPriceLabel, formatPlanLimit } from "@/lib/plans";
import { useAdminT, useAdminLocale } from "@/lib/i18n/admin/context";
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
  const t = useAdminT().domains.upgradeDialog;
  const locale = useAdminLocale();
  const targetPlan = UPGRADE_TARGET[currentPlan];

  if (!targetPlan) return null;

  const current = PLANS[currentPlan];
  const target = PLANS[targetPlan];

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={t.title}
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>
          {t.later}
        </Button>,
        <Button
          key="upgrade"
          type="primary"
          onClick={() => {
            onOpenChange(false);
            router.push(Routes.Billing);
          }}
        >
          {t.cta(target.label, planPriceLabel(target, locale))}
        </Button>,
      ]}
    >
      <Typography.Paragraph type="secondary">
        {t.body(
          current.label,
          formatPlanLimit(current.landingPagesLimit, locale, "pages"),
          target.label,
          formatPlanLimit(target.landingPagesLimit, locale, "pages"),
        )}
      </Typography.Paragraph>

      <div style={{ border: "1px solid #e6f4ff", borderRadius: 8, background: "#f0f9ff", padding: 16 }}>
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
          {t.alsoGet}
        </Typography.Text>
        {current.hasWatermark && !target.hasWatermark && (
          <Typography.Text style={{ display: "block" }}>{t.removeWatermark}</Typography.Text>
        )}
        {target.domainsLimit > current.domainsLimit && (
          <Typography.Text style={{ display: "block" }}>
            {t.moreDomains(formatPlanLimit(target.domainsLimit, locale, "domains"))}
          </Typography.Text>
        )}
      </div>
    </Modal>
  );
}
