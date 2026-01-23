import type React from "react";

import {
  CheckCircle2,
  Coins,
  Gavel,
  HandCoins,
  Megaphone,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/common/Button";
import type { ActivityKind } from "@/components/marketplace/types";

type EmptyStateProps = {
  onRefresh: () => void;
};

export function EmptyState({ onRefresh }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-cyan-200/15 bg-gradient-to-b from-[#0b1425] via-[#0e1a30] to-[#0b1425] p-7 text-center shadow-[0_22px_100px_-60px_rgba(34,211,238,0.45)]">
      <Sparkles size={24} className="text-cyan-200 drop-shadow-[0_0_20px_rgba(34,211,238,0.45)]" />
      <p className="text-base font-semibold text-white">No listings match your filters</p>
      <p className="max-w-2xl text-sm leading-relaxed text-white/70">
        New direct listings and offers appear the moment they land on-chain. Adjust filters or sync
        again to see the latest inventory.
      </p>
      <Button type="button" onClick={onRefresh} variant="primary" className="rounded-md px-4 py-2 text-sm">
        Refresh marketplace feed
      </Button>
    </div>
  );
}

type StatPillProps = {
  label: string;
  value: string;
  detail?: string;
};

export function StatPill({ label, value, detail }: StatPillProps) {
  return (
    <div className="rounded-xl border border-cyan-200/15 bg-gradient-to-br from-white/5 via-white/2 to-white/5 p-3 shadow-[0_14px_60px_-48px_rgba(34,211,238,0.4)] backdrop-blur">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">{label}</p>
      <p className="text-lg font-semibold leading-tight text-white drop-shadow-[0_6px_24px_rgba(34,211,238,0.35)]">
        {value}
      </p>
      {detail ? <p className="text-xs text-white/60">{detail}</p> : null}
    </div>
  );
}

type ProgressRowProps = {
  label: string;
  value: string;
  progress: number;
};

export function ProgressRow({ label, value, progress }: ProgressRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-white/65">
        <span className="tracking-wide">{label}</span>
        <span className="text-white/85">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-blue-400 shadow-[0_0_18px_rgba(34,211,238,0.45)]"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

type HighlightChipProps = {
  icon: React.ReactNode;
  label: string;
};

export function HighlightChip({ icon, label }: HighlightChipProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
      {icon}
      {label}
    </span>
  );
}

type SectionHeadingProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

export function SectionHeading({ title, description, icon }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
        {icon}
        {title}
      </div>
      <p className="text-sm leading-relaxed text-white/70 md:text-base">{description}</p>
    </div>
  );
}

export function BackgroundGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -right-10 top-0 h-64 w-64 rounded-full bg-cyan-400/25 blur-[120px]" />
      <div className="absolute -left-14 bottom-2 h-72 w-72 rounded-full bg-indigo-500/18 blur-[150px]" />
      <div className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(94,234,212,0.08),transparent_35%)]" />
    </div>
  );
}

type AnalyticsChipProps = {
  label: string;
  value: string;
};

export function AnalyticsChip({ label, value }: AnalyticsChipProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/70">
      <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">{label}</p>
      <p className="text-base font-semibold text-white">{value}</p>
    </div>
  );
}

type ActivityTypeBadgeProps = {
  type: ActivityKind;
};

export function ActivityTypeBadge({ type }: ActivityTypeBadgeProps) {
  const icon =
    type === "listing"
      ? <Megaphone size={16} />
      : type === "sale"
        ? <CheckCircle2 size={16} />
        : type === "auction"
          ? <Gavel size={16} />
          : type === "bid"
            ? <Coins size={16} />
            : type === "offer-accepted"
              ? <CheckCircle2 size={16} />
              : <HandCoins size={16} />;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
      {icon}
      {type.replace("-", " ")}
    </span>
  );
}
