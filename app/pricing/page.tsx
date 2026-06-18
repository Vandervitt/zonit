import { PlanComparison } from "@/components/billing/PlanComparison";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">选择适合你的套餐</h1>
          <p className="text-slate-500 text-lg">先用免费版起步，赚到第一桶金后再按需升级</p>
        </div>
        <PlanComparison />
      </div>
    </main>
  );
}
