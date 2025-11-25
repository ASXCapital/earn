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
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/15 bg-white/5 p-10 text-center">
      <Sparkles size={32} className="text-cyan-300" />
      <p className="text-lg font-semibold text-white">No listings match your filters</p>
      <p className="max-w-2xl text-sm text-white/70">
        New direct listings and offers appear the moment they land on-chain. Adjust filters or sync
        again to see the latest inventory.
      </p>
      <Button type="button" onClick={onRefresh} variant="primary">
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
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
      <p className="text-xs uppercase tracking-widest text-white/50">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
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
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>{label}</span>
        <span className="text-white/80">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
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
    <div className="flex flex-col gap-2">
      <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
        {icon}
        {title}
      </div>
      <p className="text-base text-white/70">{description}</p>
    </div>
  );
}

export function BackgroundGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -right-6 top-6 h-64 w-64 rounded-full bg-cyan-500/30 blur-[120px]" />
      <div className="absolute -left-10 bottom-0 h-72 w-72 rounded-full bg-purple-600/20 blur-[140px]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
  );
}

type AnalyticsChipProps = {
  label: string;
  value: string;
};

export function AnalyticsChip({ label, value }: AnalyticsChipProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-white/70">
      <p className="text-xs uppercase tracking-widest text-white/40">{label}</p>
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
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/60">
      {icon}
      {type.replace("-", " ")}
    </span>
  );
}
