"use client";
import { useState } from "react";

const MAIN_DOCS = [
  { name: "Directors’ Resolutions — ASX Limited (2025-07-28)", file: "/docs/2025-07-28-Directors-Resolutions-ASX-Limited.pdf" },
  { name: "ASX FJC — Financial Model", file: "/docs/ASX-FJC-NFT-Model.pdf" },
  { name: "Promissory Note — Golem → ASX (2025-04-01)", file: "/docs/Promissory-Note-Golem-to-ASX-2025-04-01.pdf" },
  { name: "Loan Agreement — ASX Limited ↔ AssetXChain (2025-04-01)", file: "/docs/Loan-Agreement-ASX-Limited-to-AssetXChain-2025-04-01.pdf" },
  { name: "Promissory Note — ASX Limited MVA (2025-04-01)", file: "/docs/Promissory-Note-ASX-Limited-MVA-2025-04-01.pdf" },
  { name: "Promissory Note — ASX Limited FJC (2025-08-18)", file: "/docs/Promissory-Note-ASX-Limited-FJC-2025-08-18.pdf" },
];

const TERMS = [
  { name: "Terms — ASX MVA NFT (Apr 2025)", file: "/docs/ASX-MVA-NFT-Terms-2025-04.pdf" },
  { name: "Terms — ASX FJC NFT (Aug 2025)", file: "/docs/ASX-FJC-NFT-Terms-2025-08.pdf" },
];

// Static listings for public/legal folders (no FS read at runtime on client; manually synced)
const LEGAL_FOLDERS = [
  {
    key: "asxrwa001",
    title: "Legal Package ASXRWA001",
    base: "/legal/asxrwa001",
    files: [
      "LoanAgreement(BVILaw)ASXLimited (4).pdf",
      "PromissoryNote(BVILaw)ASXLimited (5).pdf",
      "PromissoryNoteGolemtoASX (4).pdf",
      "TermsandConditionsofUseforNFT (5).pdf",
    ],
  },
  {
    key: "asxrwa002",
    title: "Legal Package ASXRWA002",
    base: "/legal/asxrwa002",
    files: [
      "DraftdirectorwrittenresolutionsASX Limited-1486220-v3 (2).pdf",
      "LoanAgreement(BVILaw)ASXLimited (5).pdf",
      "PromissoryNote(BVILaw)ASXLimited-1485835-v3 (1).pdf",
      "PromissoryNote-GolemtoASX (1).pdf",
      "TermsandConditionsofUseforNFT (6).pdf",
    ],
  },
];

function Section({ title, children }: { title: string; children: any }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">{title}</h2>
      {children}
    </div>
  );
}

function CardList({ items }: { items: { name: string; file: string }[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map(d => (
        <a key={d.file} href={d.file} target="_blank" className="card p-4 hover:bg-white/10 transition" rel="noreferrer">
          <div className="font-semibold">{d.name}</div>
          <div className="text-xs text-white/60 mt-1">{d.file.split('/').pop()}</div>
        </a>
      ))}
    </div>
  );
}

function LegalFolder({ folder }: { folder: typeof LEGAL_FOLDERS[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-2 bg-white/5 hover:bg-white/10 text-left">
        <span className="font-medium">{folder.title}</span>
        <span className="text-xs text-white/50">{open ? 'Hide' : 'Show'} ({folder.files.length})</span>
      </button>
      {open && (
        <ul className="divide-y divide-white/5 text-sm">
          {folder.files.map(f => (
            <li key={f} className="flex items-center justify-between px-4 py-2 hover:bg-white/5">
              <span className="truncate pr-4">{f}</span>
              <a href={`${folder.base}/${encodeURIComponent(f)}`} target="_blank" rel="noreferrer" className="text-asx-cyan text-xs hover:underline">Open</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Docs</h1>
        <div className="text-[11px] px-3 py-2 rounded-md inline-block bg-white/5 border border-white/10 text-white/70">
          This section is being expanded over the next few weeks. For comprehensive documentation visit{' '}
          <a href="https://asx-1.gitbook.io/asx-docs" target="_blank" rel="noreferrer noopener" className="text-cyan-300 hover:text-cyan-200 font-semibold">GitBook Docs ↗</a>.
        </div>
        <p className="text-white/70 max-w-3xl">Legal documents and models supplied by ASX. Grouped into main docs, terms, and detailed legal packages.</p>
      </div>

      <Section title="Main Documents">
        <CardList items={MAIN_DOCS} />
      </Section>

      <Section title="Terms">
        <CardList items={TERMS} />
      </Section>

      <Section title="Legal Packages">
        <div className="space-y-4">
          {LEGAL_FOLDERS.map(f => <LegalFolder key={f.key} folder={f} />)}
        </div>
      </Section>

      {/* Access control note removed per request */}
    </div>
  );
}
