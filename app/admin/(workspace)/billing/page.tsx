"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Typography, Card, Descriptions, Button, Space, Alert, Popconfirm, App } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { CREDIT_PACKS } from "@/lib/credits";
import { Routes, ApiRoutes } from "@/lib/constants";
import { SEMANTIC } from "@/lib/theme/antd-theme";
import { fetcher, jsonRequest } from "@/lib/api/fetcher";
import { useMutation } from "@/lib/api/use-mutation";

const { Title, Text } = Typography;

function SuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { notification } = App.useApp();
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      notification.success({
        message: "订阅成功",
        description: "套餐将在几秒内生效，稍后刷新本页即可看到。",
        placement: "topRight",
      });
      router.replace(Routes.Billing);
    } else if (searchParams.get("topup") === "1") {
      notification.success({
        message: "充值成功",
        description: "AI 额度将在几秒内到账，稍后刷新页面即可看到最新余额。",
        placement: "topRight",
      });
      router.replace(Routes.Billing);
    }
  }, [searchParams, router, notification]);
  return null;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const { notification } = App.useApp();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  // 正在发起结账的充值档位（credits 数量），用于按钮 loading 与互斥禁用。
  const [loadingCredits, setLoadingCredits] = useState<number | null>(null);
  // 支付页在新标签打开后置为 true，提示用户完成支付后刷新本页以拉取最新套餐。
  const [awaitingRefresh, setAwaitingRefresh] = useState(false);
  // 渠道侧订阅处于「周期末取消」（换档 409 才得知）：本地 DB 可能没记到期时间
  // （历史事件乱序等失同步场景），据此兜底渲染取消提示条与「恢复订阅」入口。
  const [cancelScheduled, setCancelScheduled] = useState(false);

  const currentPlanId = (session?.user?.plan ?? "free") as PlanId;
  const currentPlan = PLANS[currentPlanId];
  const currentIdx = PLAN_ORDER.indexOf(currentPlanId);
  // 周期末取消：权益保留至该时间，到期由渠道 expired 事件回落 free。
  const billingExpiresAt = session?.user?.billingExpiresAt ?? null;
  // 赠送套餐（comp_plan）无渠道真实订阅：自助换档会 404，隐藏「更换套餐」区、改示说明。
  // free 用户仍需展示升级区（走 checkout 新开订阅），故仅对「非 free 且无订阅」隐藏。
  const isCompedWithoutSub = currentPlanId !== "free" && session?.user?.hasSubscription === false;

  const checkout = useMutation(
    (planId: string) => jsonRequest<{ checkoutUrl?: string }>(ApiRoutes.BillingCheckout, "POST", { planId }),
    {
      onError: () => {
        notification.error({ message: "无法创建结账链接", description: "请稍后重试。", placement: "topRight" });
        return false;
      },
      onSuccess: (res) => {
        if (!res.checkoutUrl) {
          notification.error({ message: "无法创建结账链接", description: "请稍后重试。", placement: "topRight" });
          return;
        }
        // 新标签打开支付页，保留本页；被浏览器拦截弹窗时退回当前标签跳转。
        const win = window.open(res.checkoutUrl, "_blank", "noopener,noreferrer");
        if (win) {
          setAwaitingRefresh(true);
          notification.info({
            message: "支付页已在新标签页打开",
            description: "完成支付后请刷新本页查看最新套餐。",
            placement: "topRight",
          });
        } else {
          window.location.href = res.checkoutUrl;
        }
      },
    },
  );

  // AI 额度充值：一次性支付，额度由 credit_purchased webhook 回写余额。与订阅 checkout 同样在新标签打开。
  const credits = useMutation(
    (amount: number) => jsonRequest<{ checkoutUrl?: string }>(ApiRoutes.BillingCredits, "POST", { credits: amount }),
    {
      onError: () => {
        notification.error({ message: "无法创建充值链接", description: "请稍后重试。", placement: "topRight" });
        return false;
      },
      onSuccess: (res) => {
        if (!res.checkoutUrl) {
          notification.error({ message: "无法创建充值链接", description: "请稍后重试。", placement: "topRight" });
          return;
        }
        const win = window.open(res.checkoutUrl, "_blank", "noopener,noreferrer");
        if (win) {
          setAwaitingRefresh(true);
          notification.info({
            message: "支付页已在新标签页打开",
            description: "完成支付后请刷新本页查看最新额度余额。",
            placement: "topRight",
          });
        } else {
          window.location.href = res.checkoutUrl;
        }
      },
    },
  );

  const portal = useMutation(
    () => fetcher<{ portalUrl?: string }>(ApiRoutes.BillingPortal),
    {
      onError: () => {
        notification.error({ message: "无法获取管理链接", description: "请稍后重试。", placement: "topRight" });
        return false;
      },
      onSuccess: (res) => {
        if (res.portalUrl) window.location.href = res.portalUrl;
        else notification.error({ message: "无法获取管理链接", description: "请稍后重试。", placement: "topRight" });
      },
    },
  );

  // 已订阅用户升/降档：改现有订阅（渠道按比例计费），不得走 checkout 另开订阅（会重复扣费）。
  const changePlan = useMutation(
    (planId: string) => jsonRequest<{ ok?: boolean }>(ApiRoutes.BillingChangePlan, "POST", { planId }),
    {
      onError: (err) => {
        if (err.code === "subscription_cancel_scheduled") {
          setCancelScheduled(true);
          notification.warning({
            message: "订阅已安排取消，暂不能换档",
            description: "当前订阅将在本计费周期结束时取消。请先在上方提示条点击「恢复订阅」，恢复后即可切换档位。",
            placement: "topRight",
          });
          return false; // 已用 notification 提示，跳过默认 toast
        }
        if (err.code === "no_active_subscription") {
          // 赠送套餐或无有效订阅：无自助订阅可改，重试无效，据实说明。
          notification.warning({
            message: "当前套餐无法在此切换",
            description: "你的套餐来自管理员赠送、暂无自助订阅，无法在此升降档。如需调整请联系我们。",
            placement: "topRight",
          });
          return false;
        }
        notification.error({ message: "套餐切换失败", description: "请稍后重试或联系支持。", placement: "topRight" });
        return false;
      },
      onSuccess: () => {
        setAwaitingRefresh(true);
        notification.success({
          message: "套餐切换请求已提交",
          description: "生效后刷新本页即可看到新档位。",
          placement: "topRight",
        });
      },
    },
  );

  // 撤销周期末取消，订阅恢复正常续费；到期标记由渠道 webhook 清除。
  const resume = useMutation(
    () => jsonRequest<{ ok?: boolean }>(ApiRoutes.BillingResume, "POST"),
    {
      onError: () => {
        notification.error({ message: "恢复订阅失败", description: "请稍后重试或联系支持。", placement: "topRight" });
        return false;
      },
      onSuccess: () => {
        setCancelScheduled(false);
        setAwaitingRefresh(true);
        notification.success({
          message: "订阅已恢复",
          description: "将正常续费，现在可以切换档位了。",
          placement: "topRight",
        });
      },
    },
  );

  async function handleSelectPlan(planId: string) {
    setLoadingPlan(planId);
    if (currentPlanId === "free") await checkout.trigger(planId);
    else await changePlan.trigger(planId);
    setLoadingPlan(null);
  }

  async function handleBuyCredits(amount: number) {
    setLoadingCredits(amount);
    await credits.trigger(amount);
    setLoadingCredits(null);
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

      {(billingExpiresAt || cancelScheduled) && currentPlanId !== "free" && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          message="订阅已取消"
          description={
            billingExpiresAt
              ? `当前 ${currentPlan.label} 套餐权益保留至 ${new Date(billingExpiresAt).toLocaleString("zh-CN")}，到期后自动回落 Free。取消期间无法切换档位，恢复订阅后即可正常续费与换档。`
              : `当前 ${currentPlan.label} 订阅已安排在本计费周期结束时取消，期间无法切换档位。点击「恢复订阅」可撤销取消并继续正常续费。`
          }
          action={
            <Button size="small" type="primary" loading={resume.isMutating} onClick={() => void resume.trigger()}>
              恢复订阅
            </Button>
          }
        />
      )}

      {awaitingRefresh && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
          message="操作完成后请刷新页面"
          description="支付或套餐切换生效后，点击右侧按钮刷新以显示最新的订阅档位。"
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
            {currentPlanId !== "free" && !isCompedWithoutSub && (
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

      {isCompedWithoutSub ? (
        <Alert
          type="info"
          showIcon
          message="当前套餐由管理员赠送"
          description="赠送套餐没有可自助管理的订阅，无法在此升级或降级。如需调整套餐，请联系我们。"
        />
      ) : (
      <div>
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          {currentPlanId === "free" ? "可升级套餐" : "更换套餐（立即生效，差额按比例计费/抵扣）"}
        </Text>
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          {PLAN_ORDER.filter((p) => p !== "free" && p !== currentPlanId).map((planId) => {
            const plan = PLANS[planId];
            const isLoading = loadingPlan === planId;
            const isUpgrade = PLAN_ORDER.indexOf(planId) > currentIdx;
            const button = (
              <Button
                type={isUpgrade ? "primary" : "default"}
                loading={isLoading}
                disabled={!!loadingPlan && !isLoading}
                onClick={isUpgrade || currentPlanId === "free" ? () => handleSelectPlan(planId) : undefined}
                style={{ flexShrink: 0 }}
              >
                {isUpgrade ? "升级" : "降级"}
              </Button>
            );
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
                  {isUpgrade ? (
                    button
                  ) : (
                    <Popconfirm
                      title="确认降级？"
                      description={`将立即切换到 ${plan.label}，超出新档上限的功能会受限，差额按比例抵扣。`}
                      okText="确认降级"
                      cancelText="再想想"
                      onConfirm={() => handleSelectPlan(planId)}
                    >
                      {button}
                    </Popconfirm>
                  )}
                </div>
              </Card>
            );
          })}
        </Space>
      </div>
      )}

      <div style={{ marginTop: 32 }}>
        <Text strong style={{ display: "block", marginBottom: 4 }}>
          AI 额度充值
        </Text>
        <Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 12 }}>
          额外购买的额度永不过期，月额度用尽后自动消耗。一次性付款，不影响订阅。
        </Text>
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          {CREDIT_PACKS.map((pack) => {
            const isLoading = loadingCredits === pack.credits;
            return (
              <Card key={pack.credits}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <Space style={{ marginBottom: 4 }}>
                      <Text strong>{pack.credits} 次 AI 额度</Text>
                      <Text strong>{pack.priceText}</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                      {pack.desc}
                    </Text>
                  </div>
                  <Button
                    type={pack.highlight ? "primary" : "default"}
                    loading={isLoading}
                    disabled={loadingCredits !== null && !isLoading}
                    onClick={() => handleBuyCredits(pack.credits)}
                    style={{ flexShrink: 0 }}
                  >
                    购买
                  </Button>
                </div>
              </Card>
            );
          })}
        </Space>
      </div>

      {currentPlanId !== "free" && !isCompedWithoutSub && (
        <Text type="secondary" style={{ display: "block", marginTop: 24, textAlign: "center", fontSize: 12 }}>
          如需取消订阅，请通过 管理订阅 进入收款渠道的客户门户操作
        </Text>
      )}
    </main>
  );
}
