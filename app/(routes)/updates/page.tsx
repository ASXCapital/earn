import Link from 'next/link';
import { safeFetch } from '@/lib/safeFetch';
import { UPDATES_FEED_URL, parseRss, stripHtml, formatRssDate, Article } from '@/lib/rss';

// Revalidate RSS every 10 minutes
export const revalidate = 600;

export default async function UpdatesPage({ searchParams }: { searchParams: { [k: string]: string | string[] | undefined } }) {
  const pageParam = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const page = Math.max(1, parseInt(pageParam || '1', 10));
  const pageSize = 6;

  let articles: Article[] = [];
  let error: string | undefined;
  try {
    const res = await safeFetch(UPDATES_FEED_URL, { cacheSeconds: revalidate, retries: 4, timeoutMs: 15000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    articles = parseRss(xml);
  } catch (e: any) {
    error = e.message || 'Failed to load feed';
  }

  const total = articles.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const visible = articles.slice(start, start + pageSize);

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-medium tracking-tight">Updates</h1>
        <div className="text-xs text-white/50">Powered by Paragraph RSS</div>
      </div>
      {error && (
        <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded p-3">{error}</div>
      )}
      {!error && visible.length === 0 && (
        <div className="text-sm opacity-60">No articles found.</div>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map(a => {
          const bodySource = a.description || a.content || '';
          const stripped = stripHtml(bodySource);
          const excerpt = stripped.slice(0, 220) + (stripped.length > 220 ? '…' : '');
          return (
            <article key={a.guid || a.link} className="group relative overflow-hidden rounded-md border border-white/10 bg-white/[0.04] backdrop-blur-sm ring-1 ring-inset ring-white/5 hover:ring-white/20 transition-shadow hover:shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_8px_32px_-8px_rgba(0,0,0,0.55)] flex flex-col">
              <div className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-transparent" />
              {a.image && (
                <div className="relative overflow-hidden h-32 w-full bg-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.image} alt="" className="h-full w-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                </div>
              )}
              <div className="relative space-y-3 flex flex-col h-full p-5">
                <header className="space-y-1">
                  <h2 className="text-base font-medium leading-snug pr-6 group-hover:text-white drop-shadow-sm">{a.title}</h2>
                  <time className="text-2xs font-mono uppercase tracking-wider text-white/50">{formatRssDate(a.pubDate)}</time>
                </header>
                <p className="text-sm text-white/70 leading-relaxed line-clamp-5 min-h-[4.5rem]">{excerpt}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <Link href={a.link} target="_blank" rel="noreferrer" className="text-2xs font-medium tracking-wide text-cyan-300 hover:text-cyan-200 transition-colors inline-flex items-center gap-1">
                    Read Article →
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <PageLink disabled={safePage === 1} page={safePage - 1}>Prev</PageLink>
          <div className="text-xs font-mono text-white/60">Page {safePage} / {totalPages}</div>
          <PageLink disabled={safePage === totalPages} page={safePage + 1}>Next</PageLink>
        </div>
      )}
    </div>
  );
}

function PageLink({ page, children, disabled }: { page: number; children: React.ReactNode; disabled?: boolean }) {
  if (disabled) return <span className="px-3 py-1.5 text-2xs rounded border border-white/10 bg-white/5 text-white/30 cursor-not-allowed select-none">{children}</span>;
  return (
    <Link href={`/updates?page=${page}`} className="px-3 py-1.5 text-2xs rounded border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-white/70 transition-colors">
      {children}
    </Link>
  );
}
