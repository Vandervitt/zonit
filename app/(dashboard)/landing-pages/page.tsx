"use client";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { landingEditorPath, apiLandingUnpublishPath, apiLandingPagePath } from "@/lib/constants";

interface PageRow {
  id: string;
  name: string;
  slug: string | null;
  status: "draft" | "published";
  updated_at: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function LandingPagesPage() {
  const router = useRouter();
  const { data, mutate, isLoading } = useSWR<PageRow[]>("/api/landing-pages", fetcher);

  async function unpublish(id: string) {
    await fetch(apiLandingUnpublishPath(id), { method: "POST" });
    void mutate();
  }
  async function remove(id: string) {
    if (!confirm("确定删除该落地页？")) return;
    await fetch(apiLandingPagePath(id), { method: "DELETE" });
    void mutate();
  }

  return (
    <div className="flex-1 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">落地页</h1>
        <Link href="/editor-next" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700">
          + 新建
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">加载中…</p>
      ) : !data || data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-slate-500">还没有落地页</p>
          <Link href="/editor-next" className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">从模板新建</Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <li key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="truncate font-medium text-slate-800">{p.name}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs ${p.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {p.status === "published" ? "已发布" : "草稿"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">更新于 {new Date(p.updated_at).toLocaleString()}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <button onClick={() => router.push(landingEditorPath(p.id))} className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50">编辑</button>
                {p.status === "published" && (
                  <button onClick={() => unpublish(p.id)} className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50">取消发布</button>
                )}
                <button onClick={() => remove(p.id)} className="rounded-md border border-red-200 px-3 py-1.5 text-red-600 hover:bg-red-50">删除</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
