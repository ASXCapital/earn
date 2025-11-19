import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ActivityTypeBadge, SectionHeading } from "@/components/marketplace/components/primitives";
import type { ActivityEntry } from "@/components/marketplace/types";
import { formatRelativeTime } from "@/components/marketplace/utils";
import { MARKETPLACE_V3_EXPLORER } from "@/marketplace/config";

type ActivitySectionProps = {
  activity: ActivityEntry[];
};

export function ActivitySection({ activity }: ActivitySectionProps) {
  return (
    <section className="space-y-4">
      <SectionHeading
        title="Live activity"
        description="Listings, bids, and settlements fetched directly from the contract event logs."
        icon={<ArrowUpRight size={18} />}
      />
      {activity.length === 0 ? (
        <p className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/70">
          No on-chain events detected yet. Activity will appear as soon as listings, bids, or offers
          land on the contract.
        </p>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="space-y-4">
            {activity.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <ActivityTypeBadge type={entry.type} />
                  <div>
                    <p className="font-semibold text-white">{entry.title}</p>
                    <p className="text-xs text-white/60">{entry.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span>{formatRelativeTime(entry.timestamp)}</span>
                  {entry.txHash && (
                    <Link
                      href={`${MARKETPLACE_V3_EXPLORER}/tx/${entry.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-white/70 hover:text-white"
                    >
                      View tx
                      <ArrowUpRight size={12} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
