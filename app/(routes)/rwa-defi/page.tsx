import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RWA DeFi | ASX",
  description: "RWA DeFi is launching late January with new yield and liquidity tooling.",
};

export default function RwaDefiPage() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#060b12] via-[#0b1322] to-[#0f1a2f] px-6 py-12 text-center shadow-[0_26px_80px_-50px_rgba(20,180,180,0.45)] md:px-10">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -left-16 top-6 h-44 w-44 rounded-full bg-emerald-400/20 blur-[120px]" />
          <div className="absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-cyan-400/15 blur-[140px]" />
          <div className="absolute inset-x-10 top-8 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
        </div>
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4">
          <h1 className="text-3xl font-semibold text-white md:text-4xl">RWA DeFi</h1>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-white/60">
            Coming Late Jan
          </span>
          <p className="text-sm leading-relaxed text-white/65 md:text-base">
            Maximise your $ASX on BNB like never before
          </p>
        </div>
      </section>
    </div>
  );
}
