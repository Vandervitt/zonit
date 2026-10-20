import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingPage } from "@/landing-renderer/LandingPage";
import { getLandingPage } from "@/lib/landing-pages/store";
import { getUserPlan } from "@/lib/plans-db";
import { hasAntiBan } from "@/lib/plans";
import { deriveVariant, IDENTITY_VARIANT } from "@/landing-renderer/variant";
import { resolveCompanyInfo } from "@/lib/company-profiles/resolve";
import { landingPreviewPath } from "@/lib/constants";
import { LOCALE_COOKIE } from "@/lib/i18n/config";
import { resolveAdminLocale } from "@/lib/i18n/admin";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const page = await getLandingPage(id, session.user.id);
  if (!page) notFound();

  // 预览反映发布后真实外观：按 owner 套餐派生反同质化变体（与公开页一致）。
  const plan = await getUserPlan(page.user_id);
  const variant = hasAntiBan(plan) ? deriveVariant(page.data.variantSeed ?? page.id) : IDENTITY_VARIANT;

  // 政策链接指向本预览自己的政策子页；主体信息按引用解析，与发布后一致。
  const companyInfo = await resolveCompanyInfo(page.data.footer.companyProfileId, page.user_id);
  // 占位提示写给运营者看，跟随后台语言（与编辑器内实时预览一致）。
  const locale = resolveAdminLocale(session.user.locale, (await cookies()).get(LOCALE_COOKIE)?.value);
  return (
    <LandingPage
      page={page.data}
      variant={variant}
      preview={locale}
      policyBase={landingPreviewPath(id)}
      companyInfo={companyInfo}
    />
  );
}
