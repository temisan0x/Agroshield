"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StatCard from "@/components/vendor/StatCard";
import CaseCard from "@/components/vendor/CaseCard";
import type { CaseListItem } from "@/components/vendor/types";

type UserSummary = {
  id: string;
  email: string;
  role: "FARMER" | "VENDOR";
  walletAddress?: string;
};

export default function FarmerCasesPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const loadData = async () => {
      try {
        const token = localStorage.getItem("agroshield_token");
        if (!token) {
          router.push("/login");
          return;
        }

        const [userRes, casesRes] = await Promise.all([
          fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/cases")
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user.role !== "FARMER") {
            router.push("/marketplace");
            return;
          }
          setUser(userData.user);
        } else {
          router.push("/login");
          return;
        }

        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setCases(casesData.cases ?? []);
        }
      } catch (err) {
        setError("Failed to load cases");
      } finally {
        setLoading(false);
      }
    };

    if (hydrated) void loadData();
  }, [hydrated, router]);

  if (!hydrated || loading) {
    return (
      <div className="min-h-screen bg-[#F5F0EB]">
        <Nav />
        <div className="mx-auto max-w-5xl px-6 py-32 animate-pulse">
           <div className="h-10 w-64 rounded-2xl bg-stone-200/40 mb-8" />
           <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-12">
              {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-stone-200/40" />)}
           </div>
           <div className="grid gap-4 sm:grid-cols-2">
              {[1,2].map(i => <div key={i} className="h-48 rounded-2xl bg-stone-200/40" />)}
           </div>
        </div>
      </div>
    );
  }

  const farmerCases = cases.filter(c => c.farmer.email === user?.email);
  const farmerStats = {
    total: farmerCases.length,
    open: farmerCases.filter(c => c.status === "OPEN").length,
    inProgress: farmerCases.filter(c => c.status === "IN_PROGRESS" || c.status === "ACCEPTED").length,
    bids: farmerCases.reduce((acc, c) => acc + (c._count?.bids ?? 0), 0)
  };

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Nav />
      <main className="pt-28 pb-20">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="mb-2 inline-block rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs text-green-700">
                🌾 My Cases
              </span>
              <h1 className="font-[family-name:var(--font-manrope)] text-3xl font-extrabold tracking-tight text-neutral-900">
                Manage your uploads
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Track progress and review vendor proposals for your submissions
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/diagnose"
                className="rounded-full bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
              >
                Post New Case →
              </a>
            </div>
          </div>

          <div className="mb-12 grid grid-cols-2 gap-3 md:grid-cols-4">
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
                className="mt-5 inline-flex rounded-full bg-neutral-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
              >
                Upload your first crop photo
              </a>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-neutral-900">
                  Active Submissions
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {farmerCases.length} case{farmerCases.length !== 1 ? "s" : ""} found
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {farmerCases.map((caseItem, index) => (
                  <CaseCard
                    key={caseItem.id}
                    caseItem={caseItem}
                    index={index}
                    onClick={() => router.push(`/vendor/cases/${caseItem.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
