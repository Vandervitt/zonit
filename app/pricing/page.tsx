import { PlanComparison } from "@/components/billing/PlanComparison";

export default function PricingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-bloom-50 via-background to-background py-20 px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-glow-pink/15 blur-3xl" />
      </div>
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-foreground mb-3">选择适合你的套餐</h1>
          <p className="text-muted-foreground text-lg">先用免费版起步，赚到第一桶金后再按需升级</p>
        </div>
        <PlanComparison />
      </div>
    </main>
  );
}
