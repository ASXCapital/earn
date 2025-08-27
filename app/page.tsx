import { Suspense } from "react";
import Link from "next/link";
import { WelcomeBar } from "../components/overview/WelcomeBar";
import { MarketsStats } from "../components/overview/MarketsStats";

export default function Page() {
  return (
    <div className="space-y-10">
      <WelcomeBar />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Markets</h2>
        <Suspense fallback={<div className="opacity-60 text-sm">Loading market data…</div>}>
          <MarketsStats />
        </Suspense>
      </section>
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
        <GlassNavCard href="/rwa" title="NFT/RWA" desc="Assets" gradient="from-fuchsia-500/40 to-indigo-500/40" icon={<span className='text-lg'>🏢</span>} />
        <GlassNavCard href="/staking" title="Staking" desc="Core & BNB" gradient="from-emerald-500/40 to-teal-500/40" icon={<span className='text-lg'>⛓️</span>} />
        <GlassNavCard href="/updates" title="Updates" desc="News & posts" gradient="from-amber-500/40 to-rose-500/40" icon={<span className='text-lg'>📰</span>} />
        <GlassNavCard href="/ecosystem" title="Ecosystem" desc="Partners & tools" gradient="from-sky-500/40 to-cyan-500/40" icon={<span className='text-lg'>🌐</span>} />
      </div>
    </div>
  );
}

function GlassNavCard({ href, title, desc, gradient, icon }: { href: string; title: string; desc: string; gradient: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className={
      `group relative overflow-hidden rounded-md border border-white/10 bg-white/[0.04] backdrop-blur-sm min-w-[150px]
       ring-1 ring-inset ring-white/5 hover:ring-white/20 transition-shadow hover:shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_3px_14px_-4px_rgba(0,0,0,0.55)] flex flex-col p-2 gap-1`
    }>
      <div className={`absolute inset-0 pointer-events-none opacity-60 group-hover:opacity-80 transition-opacity bg-gradient-to-br ${gradient}`}></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)] opacity-40 mix-blend-overlay"></div>
      <div className="relative flex items-center gap-1.5">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-white/10 ring-1 ring-white/20 text-white/80 group-hover:text-white group-hover:bg-white/15 transition-colors text-[13px]">
          {icon}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[12px] font-semibold tracking-wide text-white group-hover:drop-shadow">{title}</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-white/60 group-hover:text-white/80 transition-colors whitespace-nowrap">{desc}</span>
        </div>
      </div>
      <div className="relative mt-auto flex justify-end">
        <span className="text-[8px] font-medium text-white/40 group-hover:text-white/60 tracking-wider">Explore →</span>
      </div>
    </Link>
  );
}
