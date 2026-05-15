"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Skeleton, ProfileSkeleton } from "@/components/Skeleton";
import MarketplaceFeed from "@/components/vendor/MarketplaceFeed";
import StatCard from "@/components/vendor/StatCard";
import type { CaseListItem } from "@/components/vendor/types";

type UserSummary = {
  id: string;
  email: string;
  role: "FARMER" | "VENDOR";
  walletAddress?: string;
};

type MarketplaceStats = {
  openCases: number;
  totalBids: number;
  activeBids: number; // For vendors
  wonCases: number;   // For vendors
  highUrgency: number;
};

export default function MarketplacePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);

  useEffect(() => {
    setHydrated(true);
    const token = localStorage.getItem("agroshield_token");
    setIsAuthed(!!token);
  }, []);

  const loadMarketplace = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("agroshield_token");
      
      const [casesRes, userRes] = await Promise.all([
        fetch("/api/cases"),
        hydrated && isAuthed 
          ? fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
          : Promise.resolve(null)
      ]);

      if (!casesRes.ok) throw new Error("Failed to load marketplace cases");
      const casesData = await casesRes.json();
      const fetchedCases: CaseListItem[] = casesData.cases ?? [];
      setCases(fetchedCases);

      let resolvedUser: UserSummary | null = null;
      if (userRes && userRes.ok) {
        const userData = await userRes.json();
        resolvedUser = userData.user;
        setUser(resolvedUser);
      }

      // Calculate stats
      const openCasesCount = fetchedCases.filter(c => c.status === "OPEN").length;
      const highUrgencyCount = fetchedCases.filter(c => 
        c.status === "OPEN" && String(c.diagnosis?.urgency ?? "").toLowerCase().includes("high")
      ).length;
      const totalBidsCount = fetchedCases.reduce((acc, c) => acc + (c._count?.bids ?? 0), 0);

      let activeBids = 0;
      let wonCases = 0;

      if (resolvedUser?.role === "VENDOR" && token) {
        const profileRes = await fetch("/api/profile/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profilePayload = await profileRes.json();
          const pStats = profilePayload.profile.stats ?? [];
          activeBids = Number(pStats.find((s: any) => s.label === "Bids placed")?.value ?? 0);
          wonCases = Number(pStats.find((s: any) => s.label === "Selected wins")?.value ?? 0);
        }
      }

      setStats({
        openCases: openCasesCount,
        totalBids: totalBidsCount,
        activeBids,
        wonCases,
        highUrgency: highUrgencyCount
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated) void loadMarketplace();
  }, [hydrated]);

  const renderLoading = () => (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="animate-pulse space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="h-5 w-32 rounded-full bg-stone-200/40" />
            <div className="h-10 w-64 rounded-2xl bg-stone-200/40" />
            <div className="h-4 w-56 rounded-full bg-stone-200/40" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 rounded-2xl bg-stone-200/40" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-48 rounded-2xl bg-stone-200/40" />
          ))}
        </div>
      </div>
    </div>
  );

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Nav />
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pt-28 pb-20"
      >
        {loading ? (
          renderLoading()
        ) : error ? (
          <div className="mx-auto max-w-md py-32 text-center">
            <div className="rounded-3xl border border-red-200 bg-red-50 p-10">
              <p className="text-sm font-semibold text-red-700">Unable to load Marketplace</p>
              <p className="mt-2 text-xs text-red-500">{error}</p>
              <button 
                onClick={() => void loadMarketplace()}
                className="mt-6 rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-5xl px-6 py-10">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="mb-2 inline-block rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs text-green-700">
                  🌿 Open Marketplace
                </span>
                <h1 className="font-[family-name:var(--font-manrope)] text-3xl font-extrabold tracking-tight text-neutral-900">
                  {user?.role === "FARMER" ? "Explore the marketplace" : "Pick the next case to treat"}
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  {user?.role === "FARMER" 
                    ? "See how vendors are helping other farmers across the network" 
                    : "Filter by urgency or location to find the right match"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {user?.role === "FARMER" ? (
                  <Link
                    href="/farmer/cases"
                    className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  >
                    My Cases →
                  </Link>
                ) : (
                  <>
                    <a
                      href="/vendor/bids"
                      className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm text-neutral-600 transition hover:bg-neutral-50"
                    >
                      View My Bids →
                    </a>
                    <a
                      href="/vendor/profile"
                      className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm text-neutral-600 transition hover:bg-neutral-50"
                    >
                      Update Profile
                    </a>
                  </>
                )}
              </div>
            </div>

            <div className="mb-12 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Open Cases" value={stats?.openCases ?? 0} helper="cases available" />
              {user?.role === "VENDOR" ? (
                <>
                  <StatCard label="My Active Bids" value={stats?.activeBids ?? 0} helper="in review" delay={0.05} />
                  <StatCard label="Won Cases" value={stats?.wonCases ?? 0} helper="in escrow" delay={0.1} />
                </>
              ) : (
                <>
                  <StatCard label="Total Bids" value={stats?.totalBids ?? 0} helper="network activity" delay={0.05} />
                  <StatCard label="Resolved" value="98%" helper="success rate" delay={0.1} />
                </>
              )}
              <StatCard label="Response Time" value="< 24h" helper="avg vendor reply" delay={0.15} />
            </div>

            <div className="mb-6">
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-neutral-900">
                {user?.role === "FARMER" ? "All Farmer Requests" : "Open Cases"}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Browse requests from farmers across the region.
              </p>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:w-80">
              <div className="rounded-2xl bg-white/30 px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Open now</p>
                <p className="mt-1 text-2xl font-bold text-neutral-900">{stats?.openCases ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white/30 px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">High urgency</p>
                <p className="mt-1 text-2xl font-bold text-neutral-900">{stats?.highUrgency ?? 0}</p>
              </div>
            </div>

            <MarketplaceFeed initialCases={cases} />
          </div>
        )}
      </motion.main>
      <Footer />
    </div>
  );
}
