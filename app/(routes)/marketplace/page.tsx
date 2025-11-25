import type { Metadata } from "next";

const pillars = [
  { title: "Clean execution", copy: "Fast sweeps, low-friction lists, and signals that stay out of your way." },
  { title: "Real liquidity", copy: "Whitelisted collections only, surfaced with depth and integrity by default." },
  { title: "Creator-first", copy: "Tooling built with artists and partners in the loop, not bolted on." },
];

const status = [
  { label: "Interface", detail: "Final polish" },
  { label: "Integrations", detail: "Partner QA" },
  { label: "Launch window", detail: "Announcing soon" },
];

export const metadata: Metadata = {
  title: "Marketplace | Coming Soon | ASX",
  description: "The ASX marketplace is being rebuilt with a minimal, liquidity-forward surface.",
};

export default function MarketplacePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-[#0b0f14]/80 px-6 py-10 sm:px-10 sm:py-14">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/60">
          <span className="rounded-full border border-white/10 px-3 py-1">ASX Marketplace</span>
          <span className="rounded-full border border-emerald-300/50 bg-emerald-400/10 px-3 py-1 text-emerald-200">
            In build
          </span>
        </div>

      </section>



      <section className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Status</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {status.map((item) => (
            <div key={item.label} className="rounded-lg border border-white/10 bg-[#0c1118] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/60">{item.label}</div>
              <div className="mt-2 text-sm font-medium text-white">{item.detail}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
