"use client";

import { useEffect, useState, Suspense } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Typography, Card, Descriptions, Button, Space, Alert, Popconfirm, Statistic, App } from "antd";
import { CheckOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { PLANS, PLAN_ORDER, planPriceLabel, formatPlanLimit } from "@/lib/plans";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { useAdminT, useAdminLocale } from "@/lib/i18n/admin/context";
import { formatDate, formatDateTime } from "@/lib/i18n/admin";
import type { PlanId } from "@/lib/plans";
import { CREDIT_PACKS, creditPackPriceLabel } from "@/lib/credits";
import type { UsageSummary } from "@/lib/ai/usage-summary";
import { Routes, ApiRoutes } from "@/lib/constants";
import { SEMANTIC } from "@/lib/theme/antd-theme";
import { fetcher, jsonRequest } from "@/lib/api/fetcher";
import { useMutation } from "@/lib/api/use-mutation";

const { Title, Text } = Typography;

function SuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { notification } = App.useApp();
  const t = useAdminT().billing;
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      notification.success({ ...t.toast.subscribed, placement: "topRight" });
      router.replace(Routes.Billing);
    } else if (searchParams.get("topup") === "1") {
      notification.success({ ...t.toast.toppedUp, placement: "topRight" });
      router.replace(Routes.Billing);
    }
  }, [searchParams, router, notification, t]);
  return null;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const { notification } = App.useApp();
  const t = useAdminT().billing;
  const locale = useAdminLocale();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  // 正在发起结账的充值档位（credits 数量），用于按钮 loading 与互斥禁用。
  const [loadingCredits, setLoadingCredits] = useState<number | null>(null);
  // 支付页在新标签打开后置为 true，提示用户完成支付后刷新本页以拉取最新套餐。
  const [awaitingRefresh, setAwaitingRefresh] = useState(false);
  // 渠道侧订阅处于「周期末取消」（换档 409 才得知）：本地 DB 可能没记到期时间
  // （历史事件乱序等失同步场景），据此兜底渲染取消提示条与「恢复订阅」入口。
  const [cancelScheduled, setCancelScheduled] = useState(false);

  // AI 额度用量/余额：充值区需在购买入口旁展示当前可用额度，否则用户付费后原地看不到到账反馈。
  // SWR 默认 focus 时重验证，从渠道支付页切回本页即会自动刷新余额。
  const usage = useSWR<UsageSummary>(ApiRoutes.AiUsage);
  const creditBalance = usage.data?.creditBalance;

  // 人民币参考换算：收款货币恒为美元，仅在中文界面于美元价旁附「约 ¥xx」；
  // 英文界面传 null 表示不需要换算（与 lib/plans.ts 的 approxCnyText 同一约定）。
  // 取不到汇率时（接口异常）仅展示美元，不阻塞任何计费操作。
  const fx = useSWR<{ rate: number }>(ApiRoutes.FxUsdCny);
  const cnyRate = locale === "zh" ? fx.data?.rate ?? null : null;

  // 生效套餐（含赠送）只用于权益上限展示；换档/管理订阅一律以付费订阅档为基准，
  // 否则「赠送档 > 付费档」时会把赠送档误当成当前订阅档（如订阅 starter + 赠送 pro 显示成 pro）。
  const effectivePlanId = (session?.user?.plan ?? "free") as PlanId;
  const currentPlanId = (session?.user?.paidPlan ?? effectivePlanId) as PlanId;
  const currentPlan = PLANS[currentPlanId];
  const currentIdx = PLAN_ORDER.indexOf(currentPlanId);
  const compPlanId = session?.user?.compPlan ?? null;
  const compPlanExpiresAt = session?.user?.compPlanExpiresAt ?? null;
  // 赠送档高于付费档：权益按赠送档生效，需在页面明示两者区别。
  const giftedAbovePaid =
    compPlanId !== null && PLAN_ORDER.indexOf(compPlanId) > PLAN_ORDER.indexOf(currentPlanId);
  // 周期末取消：权益保留至该时间，到期由渠道 expired 事件回落 free。
  const billingExpiresAt = session?.user?.billingExpiresAt ?? null;
  // 赠送套餐（comp_plan）无渠道真实订阅：自助换档会 404，隐藏「更换套餐」区、改示说明。
  // free 用户仍需展示升级区（走 checkout 新开订阅），故仅对「非 free 生效档且无订阅」隐藏。
  const isCompedWithoutSub = effectivePlanId !== "free" && session?.user?.hasSubscription === false;

  const checkout = useMutation(
    (planId: string) => jsonRequest<{ checkoutUrl?: string }>(ApiRoutes.BillingCheckout, "POST", { planId }),
    {
      onError: () => {
        notification.error({ message: t.errors.checkoutLink, description: t.errors.retryLater, placement: "topRight" });
        return false;
      },
      onSuccess: (res) => {
        if (!res.checkoutUrl) {
          notification.error({ message: t.errors.checkoutLink, description: t.errors.retryLater, placement: "topRight" });
          return;
        }
        // 新标签打开支付页，保留本页；被浏览器拦截弹窗时退回当前标签跳转。
        const win = window.open(res.checkoutUrl, "_blank", "noopener,noreferrer");
        if (win) {
          setAwaitingRefresh(true);
          notification.info({
            message: t.toast.checkoutOpened.message,
            description: t.toast.checkoutOpened.forPlan,
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
        notification.error({ message: t.errors.creditsLink, description: t.errors.retryLater, placement: "topRight" });
        return false;
      },
      onSuccess: (res) => {
        if (!res.checkoutUrl) {
          notification.error({ message: t.errors.creditsLink, description: t.errors.retryLater, placement: "topRight" });
          return;
        }
        const win = window.open(res.checkoutUrl, "_blank", "noopener,noreferrer");
        if (win) {
          setAwaitingRefresh(true);
          notification.info({
            message: t.toast.checkoutOpened.message,
            description: t.toast.checkoutOpened.forCredits,
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
        notification.error({ message: t.errors.portalLink, description: t.errors.retryLater, placement: "topRight" });
        return false;
      },
      onSuccess: (res) => {
        if (res.portalUrl) window.location.href = res.portalUrl;
        else notification.error({ message: t.errors.portalLink, description: t.errors.retryLater, placement: "topRight" });
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
          notification.warning({ ...t.changePlan.cancelScheduled, placement: "topRight" });
          return false; // 已用 notification 提示，跳过默认 toast
        }
        if (err.code === "no_active_subscription") {
          // 赠送套餐或无有效订阅：无自助订阅可改，重试无效，据实说明。
          notification.warning({ ...t.changePlan.noSubscription, placement: "topRight" });
          return false;
        }
        notification.error({ message: t.errors.changePlan, description: t.errors.retryOrContact, placement: "topRight" });
        return false;
      },
      onSuccess: () => {
        setAwaitingRefresh(true);
        notification.success({ ...t.changePlan.submitted, placement: "topRight" });
      },
    },
  );

  // 撤销周期末取消，订阅恢复正常续费；到期标记由渠道 webhook 清除。
  const resume = useMutation(
    () => jsonRequest<{ ok?: boolean }>(ApiRoutes.BillingResume, "POST"),
    {
      onError: () => {
        notification.error({ message: t.errors.resume, description: t.errors.retryOrContact, placement: "topRight" });
        return false;
      },
      onSuccess: () => {
        setCancelScheduled(false);
        setAwaitingRefresh(true);
        notification.success({ ...t.resumed, placement: "topRight" });
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

  // 权益上限按生效套餐（含赠送）展示；「套餐」「订阅档位」两行区分赠送与付费。
  const entitlementPlan = PLANS[effectivePlanId];
  const currentPlanDescItems = [
    {
      key: "plan",
      label: t.currentPlan.labels.plan,
      children: (
        <Space>
          <PlanBadge plan={effectivePlanId} />
          {giftedAbovePaid ? (
            <Text type="secondary">
              {t.currentPlan.grantedByAdmin}
              {compPlanExpiresAt ? t.currentPlan.grantedUntil(formatDate(compPlanExpiresAt, locale)) : ""}
            </Text>
          ) : (
            <Text strong>{planPriceLabel(currentPlan, locale, cnyRate)}</Text>
          )}
        </Space>
      ),
    },
    ...(giftedAbovePaid && session?.user?.hasSubscription
      ? [
          {
            key: "subscription",
            label: t.currentPlan.labels.subscription,
            children: (
              <Space>
                <PlanBadge plan={currentPlanId} />
                <Text strong>{planPriceLabel(currentPlan, locale, cnyRate)}</Text>
              </Space>
            ),
          },
        ]
      : []),
    {
      key: "pages",
      label: t.currentPlan.labels.pages,
      children: formatPlanLimit(entitlementPlan.landingPagesLimit, locale, "pages"),
    },
    {
      key: "domains",
      label: t.currentPlan.labels.domains,
      // 0 个域名槽位在这里要说「不支持」而非 formatPlanLimit 的破折号：
      // 计费页是用户判断该不该升档的地方，破折号读起来像「未知」。
      children:
        entitlementPlan.domainsLimit === 0
          ? t.currentPlan.domainsNotIncluded
          : formatPlanLimit(entitlementPlan.domainsLimit, locale, "domains"),
    },
    {
      key: "watermark",
      label: t.currentPlan.labels.watermark,
      children: entitlementPlan.hasWatermark ? t.currentPlan.watermarkOn : t.currentPlan.watermarkOff,
    },
  ];

  return (
    <main style={{ maxWidth: 720, padding: "24px" }}>
      <Suspense>
        <SuccessToast />
      </Suspense>

      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          {t.title}
        </Title>
        <Text type="secondary">{t.subtitle}</Text>
      </div>

      {(billingExpiresAt || cancelScheduled) && currentPlanId !== "free" && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          message={t.cancelledBanner.title}
          description={
            billingExpiresAt
              ? t.cancelledBanner.withDate(currentPlan.label, formatDateTime(billingExpiresAt, locale))
              : t.cancelledBanner.withoutDate(currentPlan.label)
          }
          action={
            <Button size="small" type="primary" loading={resume.isMutating} onClick={() => void resume.trigger()}>
              {t.cancelledBanner.resume}
            </Button>
          }
        />
      )}

      {awaitingRefresh && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
          message={t.awaitingRefresh.title}
          description={t.awaitingRefresh.description}
          action={
            <Button size="small" type="primary" onClick={() => window.location.reload()}>
              {t.awaitingRefresh.action}
            </Button>
          }
        />
      )}

      <Card
        title={t.currentPlan.title}
        style={{ marginBottom: 24 }}
        extra={
          <Space>
            {currentPlanId !== "free" && !isCompedWithoutSub && (
              <Button
                loading={portalLoading}
                onClick={() => void portal.trigger()}
              >
                {t.currentPlan.managePortal}
              </Button>
            )}
            <Button
              type="link"
              href={Routes.Pricing}
              target="_blank"
            >
              {t.currentPlan.compare}
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
          message={t.compedNotice.message}
          description={t.compedNotice.description}
        />
      ) : (
      <div>
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          {currentPlanId === "free" ? t.switcher.fromFree : t.switcher.change}
        </Text>
        {giftedAbovePaid && compPlanId && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message={t.switcher.giftedNotice(currentPlan.label, PLANS[compPlanId].label)}
          />
        )}
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
                {isUpgrade ? t.switcher.upgrade : t.switcher.downgrade}
              </Button>
            );
            return (
              <Card key={planId}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <Space style={{ marginBottom: 8 }}>
                      <PlanBadge plan={planId} />
                      <Text strong>{planPriceLabel(plan, locale, cnyRate)}</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                      {t.switcher.includesPrevious(PLANS[PLAN_ORDER[PLAN_ORDER.indexOf(planId) - 1]].label)}
                    </Text>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                      {getDictionary(locale).plans.highlights[planId].map((h) => (
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
                      title={t.switcher.downgradeConfirm.title}
                      description={t.switcher.downgradeConfirm.description(plan.label)}
                      okText={t.switcher.downgradeConfirm.ok}
                      cancelText={t.switcher.downgradeConfirm.cancel}
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
          {t.credits.title}
        </Text>
        <Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 12 }}>
          {t.credits.description}
        </Text>
        <Card style={{ marginBottom: 12 }}>
          <Space align="center" size={12} style={{ width: "100%", justifyContent: "space-between" }}>
            <Statistic
              title={t.credits.balanceTitle}
              value={usage.error ? "—" : creditBalance ?? "—"}
              loading={!usage.data && !usage.error}
              prefix={<ThunderboltOutlined style={{ color: SEMANTIC.warning }} />}
              suffix={t.credits.balanceSuffix}
            />
            <Text type="secondary" style={{ fontSize: 12, textAlign: "right" }}>
              {t.credits.neverExpire[0]}
              <br />
              {t.credits.neverExpire[1]}
            </Text>
          </Space>
        </Card>
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          {CREDIT_PACKS.map((pack) => {
            const isLoading = loadingCredits === pack.credits;
            return (
              <Card key={pack.credits}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <Space style={{ marginBottom: 4 }}>
                      <Text strong>{t.credits.packLabel(pack.credits)}</Text>
                      <Text strong>{creditPackPriceLabel(pack, cnyRate)}</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                      {t.credits.packDesc[pack.credits as keyof typeof t.credits.packDesc]}
                    </Text>
                  </div>
                  <Button
                    type={pack.highlight ? "primary" : "default"}
                    loading={isLoading}
                    disabled={loadingCredits !== null && !isLoading}
                    onClick={() => handleBuyCredits(pack.credits)}
                    style={{ flexShrink: 0 }}
                  >
                    {t.credits.buy}
                  </Button>
                </div>
              </Card>
            );
          })}
        </Space>
      </div>

      {currentPlanId !== "free" && !isCompedWithoutSub && (
        <Text type="secondary" style={{ display: "block", marginTop: 24, textAlign: "center", fontSize: 12 }}>
          {t.cancelHint}
        </Text>
      )}
    </main>
  );
}
