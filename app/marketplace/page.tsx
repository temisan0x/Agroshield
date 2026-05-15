"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import MarketplaceFeed from "@/components/vendor/MarketplaceFeed";
import CaseCard from "@/components/vendor/CaseCard";
import CaseDetail from "@/components/vendor/CaseDetail";
import StatCard from "@/components/vendor/StatCard";
import type { CaseListItem } from "@/components/vendor/types";
import { useAuthStatus, useHydrated } from "@/lib/auth-client";

type UserSummary = {
  id: string;
  role: "FARMER" | "VENDOR";
  email: string;
};

type VendorStats = {
  openCases: number;
  activeBids: number;
  wonCases: number;
  highUrgency: number;
};

export default function MarketplacePage() {
  const reduceMotion = useReducedMotion();
  const hydrated = useHydrated();
  const isAuthed = useAuthStatus();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [vendorStats, setVendorStats] = useState<VendorStats | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    const token = localStorage.getItem("agroshield_token");
    if (!token) {
      setUser(null);
      return null;
    }

    const response = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = (await response.json()) as { user?: UserSummary; error?: string };
    if (!response.ok || !payload.user) {
      throw new Error(payload.error ?? "Failed to load user.");
    }
    setUser(payload.user);
    return payload.user;
  };

  const fetchCases = async () => {
    const response = await fetch("/api/cases");
    const payload = (await response.json()) as { cases?: CaseListItem[]; error?: string };
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load cases.");
    }
    setCases(payload.cases ?? []);
  };

  const fetchVendorStats = async () => {
    const token = localStorage.getItem("agroshield_token");
    if (!token) {
      setVendorStats({ openCases: 0, activeBids: 0, wonCases: 0, highUrgency: 0 });
      return;
    }

    const [casesRes, profileRes] = await Promise.all([
      fetch("/api/cases"),
      fetch("/api/profile/summary", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const casesPayload = (await casesRes.json()) as { cases?: CaseListItem[] };
    const profilePayload = (await profileRes.json()) as {
      profile?: { stats?: Array<{ label: string; value: string }> };
      error?: string;
    };

    if (!casesRes.ok || !profileRes.ok || !profilePayload.profile) {
      throw new Error(profilePayload.error ?? "Failed to load vendor stats.");
    }

    const openCases = (casesPayload.cases ?? []).filter((entry) => entry.status === "OPEN").length;
    const stats = profilePayload.profile.stats ?? [];
    const activeBids = Number(stats.find((s) => s.label === "Bids placed")?.value ?? 0);
    const wonCases = Number(stats.find((s) => s.label === "Selected wins")?.value ?? 0);

    const highUrgency = (casesPayload.cases ?? []).filter((entry) => 
      entry.status === "OPEN" && String(entry.diagnosis?.urgency ?? "").toLowerCase().includes("high")
    ).length;
    setVendorStats({ openCases, activeBids, wonCases, highUrgency });
  };

  const loadMarketplace = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("agroshield_token");
      
      // Parallelize fetches
      const [casesRes, userRes] = await Promise.all([
        fetch("/api/cases"),
        hydrated && isAuthed 
          ? fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
          : Promise.resolve(null)
      ]);

      if (!casesRes.ok) throw new Error("Failed to load marketplace cases");
      const casesData = await casesRes.json();
      const fetchedCases = casesData.cases ?? [];
      setCases(fetchedCases);

      let resolvedUser: UserSummary | null = null;
      if (userRes && userRes.ok) {
        const userData = await userRes.json();
        resolvedUser = userData.user;
        setUser(resolvedUser);
      }

      if (resolvedUser?.role === "VENDOR") {
        // Fetch only profile summary, use already fetched cases for stats
        const profileRes = await fetch("/api/profile/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (profileRes.ok) {
          const profilePayload = await profileRes.json();
          const stats = profilePayload.profile.stats ?? [];
          const openCases = fetchedCases.filter((entry: any) => entry.status === "OPEN").length;
          const highUrgency = fetchedCases.filter((entry: any) => 
            entry.status === "OPEN" && String(entry.diagnosis?.urgency ?? "").toLowerCase().includes("high")
          ).length;
          const activeBids = Number(stats.find((s: any) => s.label === "Bids placed")?.value ?? 0);
          const wonCases = Number(stats.find((s: any) => s.label === "Selected wins")?.value ?? 0);
          setVendorStats({ openCases, activeBids, wonCases, highUrgency });
        }
      }
    } catch (err) {
      console.error("[MARKETPLACE_LOAD]", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    loadMarketplace();
  }, [hydrated, isAuthed]);

  const farmerCases = useMemo(() => {
    if (!user?.id) return [];
    return cases.filter((entry) => entry.farmerId === user.id);
  }, [cases, user?.id]);

  const farmerStats = useMemo(() => {
    if (!user?.id) return { total: 0, open: 0, inProgress: 0, bids: 0 };
    const owned = cases.filter((entry) => entry.farmerId === user.id);
    const open = owned.filter((entry) => entry.status === "OPEN").length;
    const inProgress = owned.filter((entry) => entry.status !== "OPEN").length;
    const bids = owned.reduce((sum, entry) => sum + (entry._count?.bids ?? 0), 0);
    return { total: owned.length, open, inProgress, bids };
  }, [cases, user?.id]);

  const renderLoading = () => (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="animate-pulse space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="h-5 w-32 rounded-full bg-neutral-100" />
            <div className="h-10 w-64 rounded-2xl bg-neutral-100" />
            <div className="h-4 w-56 rounded-full bg-neutral-100" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-28 rounded-full bg-neutral-100" />
            <div className="h-10 w-32 rounded-full bg-neutral-100" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 rounded-2xl bg-neutral-100" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-48 rounded-2xl bg-neutral-100" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Nav />
      <motion.main
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="pt-28 pb-24"
      >
        {loading ? (
          renderLoading()
        ) : error ? (
          <div className="mx-auto max-w-5xl px-6">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
              <p className="text-sm font-semibold text-red-700">Marketplace error</p>
              <p className="mt-2 text-xs text-red-600">{error}</p>
              <button
                type="button"
                onClick={loadMarketplace}
                className="mt-4 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
              >
                Retry
              </button>
            </div>
          </div>
        ) : user?.role === "FARMER" ? (
          <div className="mx-auto w-full max-w-5xl px-6">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="mb-2 inline-block rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs text-green-700">
                  🌾 Farmer Workspace
                </span>
                <h1 className="font-[family-name:var(--font-manrope)] text-3xl font-extrabold tracking-tight text-neutral-900">
                  Track your crop cases and bids
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Review vendor proposals and manage your treatment requests
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/diagnose"
                  className="rounded-full bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
                >
                  Post New Case →
                </a>
                <a
                  href="/profile"
                  className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  Update Farm Profile
                </a>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Total Cases" value={farmerStats.total} helper="cases submitted" />
              <StatCard label="Open Cases" value={farmerStats.open} helper="awaiting bids" delay={0.05} />
              <StatCard label="In Progress" value={farmerStats.inProgress} helper="treatment started" delay={0.1} />
              <StatCard label="Total Bids" value={farmerStats.bids} helper="vendor proposals" delay={0.15} />
            </div>

            {farmerCases.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-neutral-200 p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F0EB] text-2xl">
                  🌿
                </div>
                <h2 className="mt-4 font-[family-name:var(--font-manrope)] text-xl font-bold text-neutral-900">
                  No cases yet
                </h2>
                <p className="mt-2 text-sm text-neutral-500">
                  Upload your first crop photo to start receiving bids.
                </p>
                <a
                  href="/diagnose"
                  className="mt-5 inline-flex rounded-full bg-neutral-900 px-5 py-2 text-xs font-semibold text-white"
                >
                  Upload your first crop photo
                </a>
              </div>
            ) : (
              <div className="mt-10 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-neutral-900">
                    Your active cases
                  </h2>
                  <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                    {farmerCases.length} total
                  </span>
                </div>
                <div className="space-y-6">
                  {farmerCases.map((caseItem, index) => (
                    <CaseCard
                      key={caseItem.id}
                      caseItem={caseItem}
                      index={index}
                      onClick={() =>
                        setSelectedCaseId((value) => (value === caseItem.id ? null : caseItem.id))
                      }
                    />
                  ))}
                </div>
                {selectedCaseId ? (
                  <div className="pt-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-neutral-900">
                        Case details
                      </h3>
                      <button
                        type="button"
                        onClick={() => setSelectedCaseId(null)}
                        className="text-xs font-semibold text-neutral-400 transition hover:text-neutral-700"
                      >
                        Hide details
                      </button>
                    </div>
                    <CaseDetail id={selectedCaseId} viewerRole="FARMER" />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-5xl px-6 py-10">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="mb-2 inline-block rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs text-green-700">
                  🌿 Open Marketplace
                </span>
                <h1 className="font-[family-name:var(--font-manrope)] text-3xl font-extrabold tracking-tight text-neutral-900">
                  Pick the next case to treat
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Filter by urgency or location to find the right match
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
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
              </div>
            </div>

            <div className="mb-12 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Open Cases" value={vendorStats?.openCases ?? 0} helper="cases available" />
              <StatCard label="My Active Bids" value={vendorStats?.activeBids ?? 0} helper="in review" delay={0.05} />
              <StatCard label="Won Cases" value={vendorStats?.wonCases ?? 0} helper="in escrow" delay={0.1} />
              <StatCard label="Response Time" value="< 24h" helper="avg vendor reply" delay={0.15} />
            </div>

            <div className="mb-6">
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-neutral-900">
                Open Cases
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Browse new farmer requests and place treatment bids.
              </p>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:w-80">
              <div className="rounded-2xl bg-white/30 px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Open now</p>
                <p className="mt-1 text-2xl font-bold text-neutral-900">{vendorStats?.openCases ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white/30 px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">High urgency</p>
                <p className="mt-1 text-2xl font-bold text-neutral-900">{vendorStats?.highUrgency ?? 0}</p>
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
