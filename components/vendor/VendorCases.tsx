"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import type { CaseListItem } from "./types";
import CaseCard from "./CaseCard";
import BidModal from "./BidModal";

type QuickFilter = "all" | "high" | "near";

export default function VendorCases() {
  const reduceMotion = useReducedMotion();
  const router = useRouter();

  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [search, setSearch] = useState("");
  const [bidCaseId, setBidCaseId] = useState<string | null>(null);
  const [placedBids, setPlacedBids] = useState<Record<string, boolean>>({});

  const fetchCases = useCallback(async () => {
    try {
      const res = await fetch("/api/cases");
      if (!res.ok) throw new Error("Failed to load cases");
      const data = await res.json();
      setCases(data.cases ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleBidSuccess = useCallback((caseId: string) => {
    setPlacedBids((prev) => ({ ...prev, [caseId]: true }));
    fetchCases();
  }, [fetchCases]);

  const filteredCases = cases.filter((c) => {
    if (c.status !== "OPEN") return false;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const disease = (c.diagnosis?.disease ?? "").toLowerCase();
      const email = c.farmer.email.toLowerCase();
      if (!disease.includes(q) && !email.includes(q)) return false;
    }

    // Quick filters
    if (quickFilter === "high") {
      const urgency = String(c.diagnosis?.urgency ?? "").toLowerCase();
      if (!urgency.includes("high")) return false;
    }

    if (quickFilter === "near") {
      const location = (c.diagnosis as { location?: string } | null)?.location ?? "";
      if (!location) return false;
    }

    return true;
  });

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="mx-auto max-w-md py-32 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8">
          <p className="text-sm font-semibold text-red-700">Error loading cases</p>
          <p className="mt-1 text-xs text-red-500">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchCases();
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
    <div className="mx-auto max-w-6xl px-6 pb-12">
      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_30px_80px_-60px_rgba(0,0,0,0.4)]"
      >
        {/* Header */}
        <div className="relative border-b border-neutral-100 px-8 py-8">
          <div className="absolute right-0 top-0 h-40 w-40 -translate-y-8 translate-x-8 rounded-full bg-[#c7f1d2] opacity-40 blur-3xl" />

          <div className="relative">
            <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-neutral-900">
              Open Cases
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Browse new farmer requests and place treatment bids from one clean queue.
            </p>

            {/* Search + Filters */}
            <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search disease or farmer email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 bg-[#F5F0EB] px-5 py-3.5 text-sm text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-neutral-300"
                />
              </div>

              <div className="flex gap-1 rounded-2xl border border-neutral-200 bg-[#F5F0EB] p-1">
                {(["all", "high", "near"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setQuickFilter(tab)}
                    className={`rounded-xl px-5 py-2 text-xs font-medium transition-all ${
                      quickFilter === tab
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    {tab === "all"
                      ? "All"
                      : tab === "high"
                        ? "High Urgency"
                        : "Location Tagged"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cases List */}
        <div className="px-8 py-8">
          <AnimatePresence mode="popLayout">
            {filteredCases.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredCases.map((c, i) => (
                  <CaseCard
                    key={c.id}
                    caseItem={c}
                    index={i}
                    onClick={() => router.push(`/vendor/cases/${c.id}`)}
                    action={
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBidCaseId(c.id);
                        }}
                        disabled={placedBids[c.id]}
                        className={`rounded-full px-5 py-2 text-xs font-semibold transition-colors ${
                          placedBids[c.id]
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-neutral-900 text-white hover:bg-neutral-800"
                        }`}
                      >
                        {placedBids[c.id] ? "Bid Placed" : "Place Bid"}
                      </button>
                    }
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-dashed border-neutral-200 bg-[#F9F4EE] px-8 py-16 text-center"
              >
                <p className="text-sm text-neutral-500">
                  {search || quickFilter !== "all"
                    ? "No cases match your current filters."
                    : "No open cases yet."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Bid Modal */}
      <AnimatePresence>
        {bidCaseId && (
          <BidModal
            caseId={bidCaseId}
            onClose={() => setBidCaseId(null)}
            onSuccess={() => handleBidSuccess(bidCaseId)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}