"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Typography, Card, Descriptions, Button, Space, Alert } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { Routes, ApiRoutes } from "@/lib/constants";
import { SEMANTIC } from "@/lib/theme/antd-theme";
import { fetcher, jsonRequest } from "@/lib/api/fetcher";
import { useMutation } from "@/lib/api/use-mutation";

const { Title, Text } = Typography;

function SuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("订阅成功！套餐将在几秒内生效。");
      router.replace(Routes.Billing);
    }
  }, [searchParams, router]);
  return null;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  // 支付页在新标签打开后置为 true，提示用户完成支付后刷新本页以拉取最新套餐。
  const [awaitingRefresh, setAwaitingRefresh] = useState(false);

  const currentPlanId = (session?.user?.plan ?? "free") as PlanId;
  const currentPlan = PLANS[currentPlanId];
  const currentIdx = PLAN_ORDER.indexOf(currentPlanId);

  const checkout = useMutation(
    (planId: string) => jsonRequest<{ checkoutUrl?: string }>(ApiRoutes.BillingCheckout, "POST", { planId }),
    {
      errorToast: () => "无法创建结账链接，请稍后重试",
      onSuccess: (res) => {
        if (!res.checkoutUrl) {
          toast.error("无法创建结账链接，请稍后重试");
          return;
        }
        // 新标签打开支付页，保留本页；被浏览器拦截弹窗时退回当前标签跳转。
        const win = window.open(res.checkoutUrl, "_blank", "noopener,noreferrer");
        if (win) {
          setAwaitingRefresh(true);
          toast.info("支付页已在新标签页打开，完成后请刷新本页查看最新套餐");
        } else {
          window.location.href = res.checkoutUrl;
        }
      },
    },
  );

  const portal = useMutation(
    () => fetcher<{ portalUrl?: string }>(ApiRoutes.BillingPortal),
    {
      errorToast: () => "无法获取管理链接，请稍后重试",
      onSuccess: (res) => {
        if (res.portalUrl) window.location.href = res.portalUrl;
        else toast.error("无法获取管理链接，请稍后重试");
      },
    },
  );

  async function handleUpgrade(planId: string) {
    setLoadingPlan(planId);
    await checkout.trigger(planId);
    setLoadingPlan(null);
  }

  const portalLoading = portal.isMutating;

  const currentPlanDescItems = [
    {
      key: "plan",
      label: "套餐",
      children: (
        <Space>
          <PlanBadge plan={currentPlanId} />
          <Text strong>{currentPlan.priceText}</Text>
        </Space>
      ),
    },
    {
      key: "pages",
      label: "落地页上限",
      children: currentPlan.landingPagesLimit === Infinity ? "无限" : `${currentPlan.landingPagesLimit} 张`,
    },
    {
      key: "domains",
      label: "域名上限",
      children:
        currentPlan.domainsLimit === 0
          ? "不支持"
          : currentPlan.domainsLimit === Infinity
          ? "无限"
          : `${currentPlan.domainsLimit} 个`,
    },
    {
      key: "watermark",
      label: "品牌水印",
      children: currentPlan.hasWatermark ? "有" : "无",
    },
  ];

  return (
    <main style={{ maxWidth: 720, padding: "24px" }}>
      <Suspense>
        <SuccessToast />
      </Suspense>

      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          账户与计费
        </Title>
        <Text type="secondary">管理你的订阅套餐</Text>
      </div>

      {awaitingRefresh && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
          message="支付完成后请刷新页面"
          description="结账已在新标签页打开。完成支付后，点击右侧按钮刷新以显示最新的订阅档位。"
          action={
            <Button size="small" type="primary" onClick={() => window.location.reload()}>
              刷新页面
            </Button>
          }
        />
      )}

      <Card
        title="当前套餐"
        style={{ marginBottom: 24 }}
        extra={
          <Space>
            {currentPlanId !== "free" && (
              <Button
                loading={portalLoading}
                onClick={() => void portal.trigger()}
              >
                管理订阅
              </Button>
            )}
            <Button
              type="link"
              href={Routes.Pricing}
              target="_blank"
            >
              查看完整对比
            </Button>
          </Space>
        }
      >
        <Descriptions items={currentPlanDescItems} column={1} size="small" />
      </Card>

      {currentIdx < PLAN_ORDER.length - 1 && (
        <div>
          <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            可升级套餐
          </Text>
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            {PLAN_ORDER.slice(currentIdx + 1).map((planId) => {
              const plan = PLANS[planId];
              const isLoading = loadingPlan === planId;
              return (
                <Card key={planId}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <Space style={{ marginBottom: 8 }}>
                        <PlanBadge plan={planId} />
                        <Text strong>{plan.priceText}</Text>
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                        包含 {PLANS[PLAN_ORDER[PLAN_ORDER.indexOf(planId) - 1]].label} 全部权益
                      </Text>
                      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                        {plan.highlights.map((h) => (
                          <li key={h} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <CheckOutlined style={{ color: SEMANTIC.success, fontSize: 12, flexShrink: 0 }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {h}
                            </Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      type="primary"
                      loading={isLoading}
                      disabled={!!loadingPlan && !isLoading}
                      onClick={() => handleUpgrade(planId)}
                      style={{ flexShrink: 0 }}
                    >
                      升级
                    </Button>
                  </div>
                </Card>
              );
            })}
          </Space>
        </div>
      )}

      {currentPlanId !== "free" && (
        <Text type="secondary" style={{ display: "block", marginTop: 24, textAlign: "center", fontSize: 12 }}>
          如需取消订阅，请通过 管理订阅 进入收款渠道的客户门户操作
        </Text>
      )}
    </main>
  );
}
