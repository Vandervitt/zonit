// app/admin/editor/[id]/preview/policy.tsx
// 编辑器预览态的政策子页。存在的理由很实际：客户在编辑器右栏点页脚的
// Privacy Policy 时，链接必须真能打开 —— 点开 404 会让人以为这功能没做。
// 与公开页同构，区别是按会话鉴权（只能看自己的页）且渲染草稿而非线上快照。
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { PolicyDocument } from "@/landing-renderer/PolicyDocument";
import { getLandingPage } from "@/lib/landing-pages/store";
import { resolveCompanyInfo } from "@/lib/company-profiles/resolve";
import { landingPreviewPath } from "@/lib/constants";
import type { PolicyKind } from "@/lib/landing-pages/policy-paths";

export async function renderEditorPolicyPreview(
  params: Promise<{ id: string }>,
  kind: PolicyKind,
) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const page = await getLandingPage(id, session.user.id);
  if (!page) notFound();

  const companyInfo = await resolveCompanyInfo(page.data.footer.companyProfileId, page.user_id);
  return (
    <PolicyDocument
      footer={page.data.footer}
      kind={kind}
      homeHref={landingPreviewPath(id)}
      companyInfo={companyInfo}
    />
  );
}
