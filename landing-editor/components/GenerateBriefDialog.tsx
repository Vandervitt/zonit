"use client";
// landing-editor/components/GenerateBriefDialog.tsx
//
// 编辑器内「AI 一键成页」资料表单：首次经 ?ai=1 深链进入时默认弹出，也可由工具栏「AI 一键成页」
// 按钮再次唤起（开关状态在 MetaContext 共享）。填写产品资料后调用
// /api/landing-pages/generate（带 pageId）为当前空白页原地生成文案，成功即把生成的
// LandingPageDraft 灌入编辑器 store（autosave 兜底落库），并清掉 URL 上的 ?ai 标记。
//
// UI 用 Ant Design（与 admin / super-admin 一致；shadcn 仅用于官网与渲染器）。编辑器路由
// 不在 (workspace) 布局下、拿不到全局 antd Provider，故本组件自带 ConfigProvider + App，
// 复用 adminTheme，使弹窗风格与后台其余表单统一。
import "@ant-design/v5-patch-for-react-19";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { App, Checkbox, ConfigProvider, Modal, Form, Input, Select, Spin, Typography } from "antd";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import { useAdminT, useAdminLocale } from "@/lib/i18n/admin/context";
import { adminTheme } from "@/lib/theme/antd-theme";
import { handleSessionExpired } from "@/lib/auth-client";
import { landingEditorPath } from "@/lib/constants";
import type { LandingPageDraft } from "@/types/schema.draft";
import { CHANNEL_LABELS } from "@/lib/ai/brief-contact";
import { useEditorDispatch } from "../store/editorStore";
import { useMeta } from "../MetaContext";

/** 生成语言选项；value 直接作为 brief.language 注入 prompt。 */
const LANGUAGES = [
  "English",
  "简体中文",
  "繁體中文",
  "Español",
  "Français",
  "Deutsch",
  "Português",
  "日本語",
  "العربية",
  "Tiếng Việt",
];

/** 语气预设（多选）：join 后作为 brief.tone 注入 prompt，指导整页文案调性。 */


/** 咨询渠道预设（多选）。标签由 lib/ai/brief-contact 的映射表派生——两处若各写一份，
 *  改一个标签就会让「勾了渠道却不生效」重新发生（它只是不再报错而已）。
 *  勾选结果既注入 prompt 影响遣词，也会落成结构化的 contact.primary（取第一个）。 */
const CTA_CHANNELS = CHANNEL_LABELS;

interface BriefForm {
  productName: string;
  description: string;
  targetAudience?: string;
  // 语气与咨询渠道均为多选，表单内以数组承载；提交前 join 成字符串再发给生成接口。
  tone?: string[];
  ctaGoal?: string[];
  language: string;
  pastedIntro?: string;
  autoImages: boolean;
}

/** 生成中的加载态：整块替换表单，展示不断递增的耗时与需核对的提示。 */
function GeneratingState({ elapsedMs }: { elapsedMs: number }) {
  const t = useAdminT().editor.generate;
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % t.checklist.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <Spin size="large" />
      <div className="text-3xl font-semibold tabular-nums text-ink">{(elapsedMs / 1000).toFixed(1)}s</div>
      <Typography.Text type="secondary">
        {t.loadingHint}
      </Typography.Text>
      <div className="mt-1 w-full rounded-lg bg-canvas p-4 text-left">
        <div className="mb-2 text-sm font-medium text-ink">{t.checklistTitle}</div>
        <ul className="space-y-2">
          {t.checklist.map((tip, i) => (
            <li
              key={i}
              className={`flex gap-2 text-sm transition-colors ${i === active ? "text-ink" : "text-ink-soft"}`}
            >
              <span aria-hidden>{i === active ? "👉" : "•"}</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const POLL_INTERVAL_MS = 2500;
/** 5 分钟：留够两轮 LLM 重试（实测单次 60~90 秒）的余量，防止极端情况下永远轮询。 */
const POLL_TIMEOUT_MS = 5 * 60_000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type PollResult = "succeeded" | "ai_quota_exhausted" | "failed" | "timeout" | "session_expired";

/**
 * 轮询 job 状态直到终态或超时。
 * 单次轮询请求本身失败（网络抖动）不算任务失败，直接进入下一轮——
 * 真正代表任务失败的是 job 状态本身变成 failed，不是「这一次没查到」。
 */
async function pollJob(
  jobId: string,
  router: { push: (href: string) => void },
  sessionExpiredMsg: string,
): Promise<PollResult> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await delay(POLL_INTERVAL_MS);
    let res: Response;
    try {
      res = await fetch(`/api/landing-pages/generate/${jobId}`);
    } catch {
      continue;
    }
    if (handleSessionExpired(res, router, sessionExpiredMsg)) return "session_expired";
    if (!res.ok) continue;
    const data = await res.json();
    if (data.status === "pending") continue;
    if (data.status === "succeeded") return "succeeded";
    return data.reason === "ai_quota_exhausted" ? "ai_quota_exhausted" : "failed";
  }
  return "timeout";
}

const ANTD_LOCALE = { en: enUS, zh: zhCN };

export function GenerateBriefDialog() {
  const locale = useAdminLocale();
  // 自带 antd 上下文：编辑器路由缺全局 Provider，component={false} 不额外产生 DOM 包裹。
  return (
    <ConfigProvider theme={adminTheme} locale={ANTD_LOCALE[locale]}>
      <App component={false}>
        <BriefModal />
      </App>
    </ConfigProvider>
  );
}

function BriefModal() {
  const t = useAdminT().editor.generate;
  const router = useRouter();
  const sessionExpiredMsg = useAdminT().common.sessionExpired;
  const dispatch = useEditorDispatch();
  // open 状态上抬到 MetaContext：首开来自 ?ai=1 深链，之后可由工具栏「AI 一键成页」按钮再次唤起。
  const { pageId, generateOpen: open, setGenerateOpen: setOpen } = useMeta();
  const { message } = App.useApp();
  const [form] = Form.useForm<BriefForm>();
  const [loading, setLoading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  // 生成中：从 0 起每 100ms 累加耗时，供加载态展示「不断递增」的秒数。
  useEffect(() => {
    if (!loading) return;
    setElapsedMs(0);
    const start = Date.now();
    const id = setInterval(() => setElapsedMs(Date.now() - start), 100);
    return () => clearInterval(id);
  }, [loading]);

  /** 关闭并清掉 ?ai 标记，避免刷新再次自动弹出。 */
  function close() {
    setOpen(false);
    router.replace(landingEditorPath(pageId));
  }

  async function handleOk() {
    let values: BriefForm;
    try {
      values = await form.validateFields();
    } catch {
      // 校验失败：antd 自动在对应字段展示错误
      return;
    }
    setLoading(true);
    try {
      // 多选字段 join 成顿号分隔字符串，契合生成接口/ prompt 对 tone、ctaGoal 的 string 约定。
      const brief = {
        ...values,
        tone: values.tone?.length ? values.tone.join("、") : undefined,
        ctaGoal: values.ctaGoal?.length ? values.ctaGoal.join("、") : undefined,
      };
      // 生成本身（跨太平洋打 DashScope）常常要一两分钟，接口只同步做校验/建 job，
      // 202 立刻回；真正的生成在后台跑，这里改成轮询 job 状态。
      const startRes = await fetch("/api/landing-pages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, brief }),
      });
      if (handleSessionExpired(startRes, router, sessionExpiredMsg)) return;
      const startData = await startRes.json();
      if (!startRes.ok) {
        if (startData.error === "ai_quota_exhausted") message.error(t.quotaExhausted);
        else if (startData.error === "limit_exceeded") message.error(t.pageLimit);
        else message.error(t.failed);
        return;
      }
      const jobId = startData.jobId as string;

      const status = await pollJob(jobId, router, sessionExpiredMsg);
      if (status === "session_expired") return; // handleSessionExpired 内部已处理跳转
      if (status !== "succeeded") {
        message.error(status === "ai_quota_exhausted" ? t.quotaExhausted : t.failed);
        return;
      }

      // 成功：job 只落状态，不带 draft——回去重新取一次页面数据，灌进编辑器 store。
      const pageRes = await fetch(`/api/landing-pages/${pageId}`);
      if (handleSessionExpired(pageRes, router, sessionExpiredMsg)) return;
      const pageData = await pageRes.json();
      dispatch({ kind: "replaceDraft", draft: pageData.data as LandingPageDraft });
      message.success(t.success);
      close();
    } catch {
      // fetch 本身失败（网络中断、连接被中间层掐断等）：上面各分支管不到这里，
      // 不补这个 catch 就是「等了一两分钟，弹窗静默变回表单」，没有任何提示。
      message.error(t.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title={loading ? t.titleLoading : t.titleIdle}
      open={open}
      onOk={handleOk}
      onCancel={close}
      okText={t.ok}
      cancelText={t.cancel}
      // 生成中：整块换成加载态，隐藏底部按钮并禁用关闭，避免中途取消或重复提交。
      footer={loading ? null : undefined}
      closable={!loading}
      keyboard={!loading}
      maskClosable={false}
      destroyOnHidden
      centered
      // 限制整体高度、让表单区自身滚动，避免长表单把弹窗顶出视口上下缘。
      styles={{ body: { maxHeight: "calc(100vh - 220px)", overflowY: "auto" } }}
    >
      {loading ? (
        <GeneratingState elapsedMs={elapsedMs} />
      ) : (
        <>
      <Typography.Paragraph type="secondary">
        {t.intro}
      </Typography.Paragraph>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ language: "English", autoImages: true }}
        requiredMark="optional"
      >
        <Form.Item
          label={t.name}
          name="productName"
          rules={[{ required: true, message: t.nameRequired }]}
        >
          <Input placeholder={t.namePlaceholder} maxLength={200} />
        </Form.Item>
        <Form.Item
          label={t.what}
          name="description"
          rules={[{ required: true, message: t.whatRequired }]}
        >
          <Input.TextArea rows={3} placeholder={t.whatPlaceholder} maxLength={4000} showCount />
        </Form.Item>
        <Form.Item label={t.audience} name="targetAudience">
          <Input placeholder={t.audiencePlaceholder} maxLength={500} />
        </Form.Item>
        <Form.Item label={t.tone} name="tone">
          <Select
            mode="multiple"
            allowClear
            placeholder={t.tonePlaceholder}
            options={t.toneOptions.map((o) => ({ value: o, label: o }))}
          />
        </Form.Item>
        <Form.Item label={t.ctaGoal} name="ctaGoal">
          <Select
            mode="multiple"
            allowClear
            placeholder={t.ctaGoalPlaceholder}
            options={CTA_CHANNELS.map((c: string) => ({ value: c, label: c }))}
          />
        </Form.Item>
        <Form.Item label={t.language} name="language">
          <Select options={LANGUAGES.map((l) => ({ value: l, label: l }))} />
        </Form.Item>
        <Form.Item label={t.pastedIntro} name="pastedIntro">
          <Input.TextArea rows={3} placeholder={t.pastedIntroPlaceholder} maxLength={8000} showCount />
        </Form.Item>
        <Form.Item
          name="autoImages"
          valuePropName="checked"
          extra={t.autoImagesExtra}
        >
          <Checkbox>{t.autoImages}</Checkbox>
        </Form.Item>
      </Form>
        </>
      )}
    </Modal>
  );
}
