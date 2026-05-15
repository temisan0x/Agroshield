"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import type { CaseListItem } from "./types";
import CaseCard from "./CaseCard";
import BidModal from "./BidModal";

type QuickFilter = "all" | "high" | "near";

export default function MarketplaceFeed() {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const handleBidSuccess = useCallback(
    (caseId: string) => {
      setPlacedBids((prev) => ({ ...prev, [caseId]: true }));
      fetchCases();
    },
    [fetchCases]
  );

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

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-48 rounded-2xl bg-neutral-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md py-32 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8">
          <p className="text-sm font-semibold text-red-700">Error</p>
          <p className="mt-1 text-xs text-red-500">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); fetchCases(); }}
            className="mt-4 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-white p-4 sm:flex-row">
        <label className="flex flex-1 items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
          <span className="text-base">🔍</span>
          <input
            type="text"
            placeholder="Search disease, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-neutral-700 outline-none placeholder:text-neutral-300"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {(["all", "high", "near"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setQuickFilter(tab)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                quickFilter === tab
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {tab === "all" ? "All" : tab === "high" ? "High Urgency" : "Near Me"}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((c, i) => (
              <CaseCard
                key={c.id}
                caseItem={c}
                index={i}
                onClick={() => router.push(`/vendor/cases/${c.id}`)}
                action={
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setBidCaseId(c.id);
                    }}
                    disabled={placedBids[c.id]}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                      placedBids[c.id]
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-neutral-900 text-white hover:bg-neutral-800"
                    }`}
                  >
                    {placedBids[c.id] ? "Bid placed" : "Place Bid →"}
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
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-20 text-center"
          >
            <div className="text-5xl">🌾</div>
            <p className="mt-4 font-[family-name:var(--font-manrope)] text-xl font-bold text-neutral-900">
              No open cases yet
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Check back soon — farmers are actively posting
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bidCaseId ? (
          <BidModal
            caseId={bidCaseId}
            onClose={() => setBidCaseId(null)}
            onSuccess={() => handleBidSuccess(bidCaseId)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
