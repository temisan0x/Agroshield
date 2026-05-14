"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import type { CaseListItem } from "./types";
import CaseCard from "./CaseCard";

type Filter = "all" | "OPEN" | "IN_PROGRESS";

export default function MarketplaceFeed() {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

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

  const filtered = cases.filter((c) => {
    if (filter !== "all" && c.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const disease = c.diagnosis?.disease?.toLowerCase() ?? "";
      const email = c.farmer.email.toLowerCase();
      if (!disease.includes(q) && !email.includes(q)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
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
    <div className="mx-auto max-w-6xl px-6">
      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_30px_80px_-60px_rgba(0,0,0,0.4)]"
      >
        <div className="relative border-b border-neutral-100 px-8 py-8">
          <div className="absolute right-0 top-0 h-40 w-40 -translate-y-8 translate-x-8 rounded-full bg-[#c7f1d2] opacity-40 blur-3xl" />
          <div className="relative">
            <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-neutral-900">Open Cases</h1>
            <p className="mt-1 text-sm text-neutral-500">Browse farmer cases and submit your treatment bids.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <input type="text" placeholder="Search by disease or farmer…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-2xl border border-neutral-200 bg-[#F5F0EB] py-3 px-4 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#c7f1d2]" />
              <div className="flex gap-1 rounded-2xl border border-neutral-200 bg-[#F5F0EB] p-1">
                {(["all", "OPEN", "IN_PROGRESS"] as const).map((tab) => (
                  <button key={tab} onClick={() => setFilter(tab)}
                    className={`rounded-xl px-4 py-1.5 text-xs font-medium transition ${filter === tab ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
                    {tab === "all" ? "All" : tab === "OPEN" ? "Open" : "In Progress"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c, i) => (
                  <CaseCard key={c.id} caseItem={c} index={i} onClick={() => router.push(`/vendor/cases/${c.id}`)} />
                ))}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-2xl border border-dashed border-neutral-200 bg-[#F9F4EE] px-6 py-16 text-center">
                <p className="text-sm text-neutral-500">
                  {search ? "No cases match your search." : "No open cases at the moment."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
