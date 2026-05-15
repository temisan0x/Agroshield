"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import type { CaseListItem, VendorBidItem } from "./types";
import { deriveBidStatus } from "./types";
import BidRow from "./BidRow";
import Link from "next/link";
import { ProfileSkeleton } from "@/components/Skeleton";

interface CaseWithBids {
  caseItem: CaseListItem;
  bids: VendorBidItem[];
}

export default function VendorBids() {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const [data, setData] = useState<CaseWithBids[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "accepted" | "rejected"
  >("all");

  const fetchBids = useCallback(async () => {
    try {
      const token = localStorage.getItem("agroshield_token");
      // First get cases the vendor may have bid on
      const casesRes = await fetch("/api/cases");
      if (!casesRes.ok) throw new Error("Failed to load cases");
      const casesData = await casesRes.json();
      const cases: CaseListItem[] = casesData.cases ?? [];

      // For each case, fetch bids
      const results: CaseWithBids[] = [];
      for (const c of cases) {
        const bidsRes = await fetch(`/api/bids/${c.id}/${c.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!bidsRes.ok) continue;
        const bidsData = await bidsRes.json();
        const bids: VendorBidItem[] = bidsData.bids ?? [];
        if (bids.length > 0) {
          results.push({ caseItem: c, bids });
        }
      }
      setData(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchBids();
    });
  }, [fetchBids]);

  const allBids = data.flatMap(({ caseItem, bids }) =>
    bids.map((bid) => ({
      ...bid,
      caseDiagnosis: caseItem.diagnosis?.disease ?? "Undiagnosed",
      caseStatus: caseItem.status,
      caseId: caseItem.id,
    })),
  );

  const filtered = allBids.filter((b) => {
    const status = deriveBidStatus(b.selected, b.caseStatus);
    if (activeTab === "pending") return status === "PENDING";
    if (activeTab === "accepted") return status === "ACCEPTED";
    if (activeTab === "rejected") return status === "REJECTED";
    return true;
  });

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md py-32 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8">
          <p className="text-sm font-semibold text-red-700">Error</p>
          <p className="mt-1 text-xs text-red-500">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchBids();
            }}
            className="mt-4 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6">
      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden"
      >
        <div className="relative border-b border-neutral-100 px-8 py-8">
          <div className="absolute right-0 top-0 h-40 w-40 -translate-y-8 translate-x-8 rounded-full bg-[#c7f1d2] opacity-40 blur-3xl" />
          <div className="relative">
            <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-neutral-900">
              My Bids
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Track the status of your submitted treatment proposals.
            </p>

            <div className="mt-6 flex gap-1 rounded-2xl border border-neutral-200 p-1 w-fit">
              {(["all", "pending", "accepted", "rejected"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-xl px-4 py-1.5 text-xs font-medium capitalize transition ${
                      activeTab === tab
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 px-8 py-6">
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              filtered.map((bid, i) => {
                const status = deriveBidStatus(bid.selected, bid.caseStatus);
                const date = new Date(bid.createdAt).toLocaleDateString(
                  "en-NG",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                );
                return (
                  <BidRow
                    key={bid.id}
                    title={bid.caseDiagnosis}
                    subtitle={`${bid.proposal.slice(0, 60)}${bid.proposal.length > 60 ? "…" : ""} · ${date}`}
                    amount={`$${Number(bid.amount).toFixed(2)}`}
                    status={status}
                    index={i}
                    onClick={() => router.push(`/vendor/cases/${bid.caseId}`)}
                  />
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-dashed border-neutral-200 bg-[#F9F4EE] px-6 py-12 text-center"
              >
                <p className="text-sm text-neutral-500">
                  {activeTab === "all"
                    ? "You haven\u2019t submitted any bids yet."
                    : `No ${activeTab} bids.`}
                </p>
                {activeTab === "all" && (
                  <Link
                    href="/vendor/cases"
                    className="mt-4 inline-block rounded-xl bg-neutral-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
                  >
                    Browse open cases
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
