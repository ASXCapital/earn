import { TOKENS, LPS } from "@/data/tokens";
import { explorerLink } from "@/lib/scanners";
import { Suspense } from 'react';
import { STAKING_POOLS } from '@/data/staking';
import { EcosystemSwitcher } from '@/components/ecosystem/EcosystemSwitcher';
import { PoolsTable } from '@/components/overview/PoolsTable';
import { UPDATES_FEED_URL, parseRss, stripHtml, formatRssDate } from '@/lib/rss';

export const revalidate = 600;

export default async function Page() {
  // Fetch a small subset of updates server-side for expanded view (no scroll box)
  let previewArticles: ReturnType<typeof parseRss> = [];
  try {
    const res = await fetch(UPDATES_FEED_URL, { next: { revalidate } });
    if (res.ok) {
      const xml = await res.text();
      previewArticles = parseRss(xml).slice(0, 3);
    }
  } catch { }
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Ecosystem</h1>
      <section className="space-y-6">
        <EcosystemSwitcher
          contracts={
            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Tokens</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {TOKENS.map((t) => (
                    <a key={t.address} href={explorerLink(t.chain, t.address)} target="_blank" rel="noreferrer" className="card p-4 hover:bg-white/10 transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold tracking-tight">{t.symbol}</div>
                          <div className="text-white/60 text-xs leading-tight">{t.name}</div>
                        </div>
                        <div className="text-xs rounded bg-white/10 px-2 py-0.5 font-mono">{t.chain.toUpperCase()}</div>
                      </div>
                      <div className="mt-2 text-white/60 text-3xs font-mono break-all">{t.address}</div>
                    </a>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Liquidity Pools (BSC)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {LPS.map((lp) => (
                    <a key={lp.address} href={explorerLink('bsc', lp.address)} target="_blank" rel="noreferrer" className="card p-4 hover:bg-white/10 transition">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold tracking-tight">{lp.label}</div>
                        <div className="text-xs rounded bg-white/10 px-2 py-0.5 font-mono">BSC</div>
                      </div>
                      <div className="mt-2 text-white/60 text-3xs font-mono break-all">{lp.address}</div>
                    </a>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Staking Pools</h2>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {STAKING_POOLS.map(sp => (
                    <a key={sp.address} href={explorerLink(sp.chain, sp.address)} target="_blank" rel="noreferrer" className="card p-4 hover:bg-white/10 transition">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold tracking-tight">{sp.label}</div>
                        <div className="text-xs rounded bg-white/10 px-2 py-0.5 font-mono">{sp.chain.toUpperCase()}</div>
                      </div>
                      <div className="mt-2 text-white/60 text-3xs font-mono break-all">{sp.address}</div>
                    </a>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Official NFT Contracts</h2>
                <ul className="grid sm:grid-cols-2 gap-3 text-xs">
                  <li className="card p-3"><div className="font-medium mb-1 tracking-tight">FJC NFT</div><code className="text-3xs break-all">0x8a747b5797b3164a64759a3d77f5a0f4e758283b</code></li>
                  <li className="card p-3"><div className="font-medium mb-1 tracking-tight">MVA NFT</div><code className="text-3xs break-all">0x649edd9af91646348aa4ba197d71eb05b9546d5a</code></li>
                </ul>
              </div>
            </div>
          }
          prices={
            <div className="space-y-4">
              <p className="text-xs text-white/50">Live on-chain pool pricing (filtered to canonical ASX contracts).</p>
              <Suspense fallback={<div className="opacity-60 text-sm">Loading pools…</div>}>
                <PoolsTable />
              </Suspense>
            </div>
          }
          updates={
            <div className="space-y-6">
              <p className="text-xs text-white/60">Latest updates (first 3). Visit full page for pagination.</p>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {previewArticles.map(a => {
                  const bodySource = a.description || a.content || '';
                  const stripped = stripHtml(bodySource);
                  const excerpt = stripped.slice(0, 200) + (stripped.length > 200 ? '…' : '');
                  return (
                    <article key={a.guid || a.link} className="group relative overflow-hidden rounded-md border border-white/10 bg-white/[0.04] backdrop-blur-sm ring-1 ring-inset ring-white/5 hover:ring-white/20 transition-shadow hover:shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_8px_32px_-8px_rgba(0,0,0,0.55)] flex flex-col">
                      <div className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-transparent" />
                      {a.image && (
                        <div className="relative overflow-hidden h-28 w-full bg-black/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.image} alt="" className="h-full w-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        </div>
                      )}
                      <div className="relative space-y-3 flex flex-col h-full p-4">
                        <header className="space-y-1">
                          <h3 className="text-sm font-semibold leading-snug pr-6 group-hover:text-white drop-shadow-sm">{a.title}</h3>
                          <time className="text-3xs font-mono uppercase tracking-wider text-white/50">{formatRssDate(a.pubDate)}</time>
                        </header>
                        <p className="text-sm text-white/70 leading-relaxed line-clamp-5 min-h-[4rem]">{excerpt}</p>
                        <div className="mt-auto pt-2">
                          <a href={a.link} target="_blank" rel="noreferrer" className="text-3xs font-medium tracking-wide text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1">Read Article →</a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <a href="/updates" className="text-2xs font-medium tracking-wide text-cyan-300 hover:text-cyan-200">View All Updates →</a>
            </div>
          }
        />
      </section>
    </div>
  );
}
