"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import type { CaseListItem } from "./types";
import CaseCard from "./CaseCard";
import BidModal from "./BidModal";

type QuickFilter = "all" | "high" | "near";
interface MarketplaceFeedProps {
  initialCases?: CaseListItem[];
}

export default function MarketplaceFeed({ initialCases }: MarketplaceFeedProps) {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const [cases, setCases] = useState<CaseListItem[]>(initialCases ?? []);
  const [loading, setLoading] = useState(!initialCases);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {  void Promise.resolve().then(fetchCases); }, [fetchCases]);

  const handleBidSuccess = useCallback((caseId: string) => {
    setPlacedBids((prev) => ({ ...prev, [caseId]: true }));
    fetchCases();
  }, [fetchCases]);

  const filtered = cases.filter((c) => {
    if (c.status !== "OPEN") return false;
    if (search) {
      const q = search.toLowerCase();
      const disease = c.diagnosis?.disease?.toLowerCase() ?? "";
      const email = c.farmer.email.toLowerCase();
      if (!disease.includes(q) && !email.includes(q)) return false;
    }
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

  return (
    <div className="mt-12">
      {/* Search + filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 px-4 py-3 transition focus-within:bg-white/40">
          <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="m13 13 4 4" />
          </svg>
          <input
            type="text"
            placeholder="Search disease or farmer email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-neutral-700 outline-none placeholder:text-neutral-400"
          />
        </div>

        <div className="flex gap-1 p-1">
          {(["all", "high", "near"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setQuickFilter(tab)}
              className={`rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap transition ${
                quickFilter === tab
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {tab === "all" ? "All" : tab === "high" ? "High urgency" : "Near me"}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="mb-4 text-xs text-neutral-500">
        {loading ? "Loading..." : `${filtered.length} case${filtered.length !== 1 ? "s" : ""} found`}
      </p>

      {/* Cases grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-neutral-200" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
          <p className="text-sm font-semibold text-red-700">Error</p>
          <p className="mt-1 text-xs text-red-500">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); fetchCases(); }}
            className="mt-4 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white">
            Retry
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((c, i) => (
                <CaseCard
                  key={c.id}
                  caseItem={c}
                  index={i}
                  onClick={() => router.push(`/vendor/cases/${c.id}`)}
                  action={
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setBidCaseId(c.id); }}
                      disabled={placedBids[c.id]}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        placedBids[c.id]
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-neutral-900 text-white hover:bg-neutral-800"
                      }`}
                    >
                      {placedBids[c.id] ? "Bid placed ✓" : "Place Bid"}
                    </button>
                  }
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-20 text-center"
            >
              <div className="text-4xl">🌾</div>
              <p className="mt-4 text-base font-semibold text-neutral-700">No open cases yet</p>
              <p className="mt-1 text-sm text-neutral-400">Check back soon for new farmer requests.</p>
            </motion.div>
          )}
        </AnimatePresence>
      )}

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