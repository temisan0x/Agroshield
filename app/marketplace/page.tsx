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
      setVendorStats({ openCases: 0, activeBids: 0, wonCases: 0 });
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

    setVendorStats({ openCases, activeBids, wonCases });
  };

  const loadMarketplace = async () => {
    setLoading(true);
    setError(null);
    try {
      let resolvedUser: UserSummary | null = null;
      if (hydrated && isAuthed) {
        resolvedUser = await fetchUser();
      } else {
        setUser(null);
      }

      await fetchCases();

      if (resolvedUser?.role === "VENDOR") {
        await fetchVendorStats();
      }
    } catch (err) {
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

  const renderLoading = () => (
    <div className="mx-auto w-full max-w-4xl px-6">
      <div className="animate-pulse space-y-6 rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-32 rounded-full bg-neutral-100" />
        <div className="h-10 w-full rounded-2xl bg-neutral-100" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 rounded-2xl bg-neutral-100" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Nav />
      <motion.main
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-28 pb-24"
      >
        {loading ? (
          renderLoading()
        ) : error ? (
          <div className="mx-auto max-w-4xl px-6">
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
          <div className="mx-auto w-full max-w-4xl px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-[family-name:var(--font-manrope)] text-3xl font-extrabold text-neutral-900">
                  My Cases
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                  Track your submissions and review vendor bids.
                </p>
              </div>
              <a
                href="/diagnose"
                className="rounded-full bg-[#16a34a] px-5 py-2 text-sm font-semibold text-white"
              >
                Post New Case →
              </a>
            </div>

            {farmerCases.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-neutral-200 bg-white p-10 text-center">
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
              <div className="mt-8 space-y-6">
                {farmerCases.map((caseItem, index) => (
                  <div key={caseItem.id} className="space-y-4">
                    <CaseCard
                      caseItem={caseItem}
                      index={index}
                      onClick={() =>
                        setSelectedCaseId((value) => (value === caseItem.id ? null : caseItem.id))
                      }
                    />
                    {selectedCaseId === caseItem.id ? (
                      <CaseDetail id={caseItem.id} viewerRole="FARMER" />
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-4xl px-6">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Open Cases" value={vendorStats?.openCases ?? 0} />
              <StatCard label="My Active Bids" value={vendorStats?.activeBids ?? 0} />
              <StatCard label="Won Cases" value={vendorStats?.wonCases ?? 0} />
            </div>
            <div className="mt-6">
              <MarketplaceFeed />
            </div>
          </div>
        )}
      </motion.main>
      <Footer />
    </div>
  );
}
