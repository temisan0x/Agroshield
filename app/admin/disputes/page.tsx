"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { signTransaction, isConnected } from "@stellar/freighter-api";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StatCard from "@/components/vendor/StatCard";

interface AdminDispute {
  id: string;
  caseId: string;
  reason: string;
  status: "OPEN" | "RESOLVED";
  resolvedBy?: string | null;
  createdAt: string;
  case: {
    diagnosis: string | null;
    farmer: { email: string };
    bids: Array<{
      amount: string;
      vendor: {
        email: string;
        vendorProfile: { businessName: string } | null;
      };
    }>;
    escrow: { amount: string } | null;
  };
}

export default function AdminDisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionState, setResolutionState] = useState<
    "idle" | "api" | "signing" | "sending" | "success"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  // Form states for resolution
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [resolutionType, setResolutionType] = useState<
    "REFUND_FARMER" | "RELEASE_VENDOR" | "SPLIT" | null
  >(null);
  const [farmerPercent, setFarmerPercent] = useState<number>(50);
  const [vendorPercent, setVendorPercent] = useState<number>(50);

  const fetchDisputes = useCallback(async () => {
    try {
      const token = localStorage.getItem("agroshield_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/disputes", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        router.push("/marketplace");
        return;
      }

      if (!res.ok) throw new Error("Failed to load disputes");

      const data = await res.json();
      setDisputes(data.disputes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleResolve = async (disputeId: string) => {
    if (!resolutionType) return;
    if (resolutionType === "SPLIT" && farmerPercent + vendorPercent !== 100) {
      setError("Percentages must sum to 100%");
      return;
    }

    setResolvingId(disputeId);
    setResolutionState("api");
    setError(null);

    try {
      const token = localStorage.getItem("agroshield_token");
      if (!token) throw new Error("Please log in again to continue.");

      // Check Freighter
      const freighterReady = await isConnected().catch(() => ({ isConnected: false }));
      if (!freighterReady.isConnected) {
        throw new Error("Please install or enable Freighter wallet to continue.");
      }

      // 1. POST /api/disputes/resolve
      const res = await fetch("/api/disputes/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          disputeId,
          resolutionType,
          farmerPercent: resolutionType === "SPLIT" ? farmerPercent : undefined,
          vendorPercent: resolutionType === "SPLIT" ? vendorPercent : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to initiate resolution");
      }

      const { unsignedTransaction } = await res.json();

      // 2. Sign with Freighter
      setResolutionState("signing");
      const signedResult = await signTransaction(unsignedTransaction, {
        networkPassphrase: "Test SDF Network ; September 2015",
      });

      if (typeof signedResult === "object" && "error" in signedResult) {
        throw new Error(signedResult.error.message || "Rejected in Freighter");
      }

      const signedXdr =
        typeof signedResult === "string"
          ? signedResult
          : (signedResult as any).signedTxXdr || (signedResult as any).signedTransaction;

      // 3. Send transaction
      setResolutionState("sending");
      const sendRes = await fetch("https://dev.api.trustlesswork.com/helper/send-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedXdr }),
      });

      if (!sendRes.ok) throw new Error("Failed to send transaction to network");

      setResolutionState("success");
      await fetchDisputes();
      setTimeout(() => {
        setResolvingId(null);
        setResolutionState("idle");
        setResolutionType(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resolution failed");
      setResolutionState("idle");
    }
  };

  const stats = {
    open: disputes.filter((d) => d.status === "OPEN").length,
    resolved: disputes.filter((d) => d.status === "RESOLVED").length,
    total: disputes.length,
  };

  const maskEmail = (email: string) => {
    const [name, domain] = email.split("@");
    return `${name.slice(0, 3)}***@${domain}`;
  };

  const parseDiagnosis = (diag: string | null) => {
    if (!diag) return "Unknown Case";
    try {
      const parsed = JSON.parse(diag);
      return parsed.disease || "Unknown Disease";
    } catch {
      return diag;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0EB]">
        <Nav />
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-12 pt-28 pb-24">
        <div className="mb-8">
          <span className="inline-block rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
            🛡 Admin
          </span>
          <h1 className="mt-3 font-[family-name:var(--font-manrope)] text-3xl font-extrabold text-neutral-900">
            Dispute Resolution
          </h1>
          <p className="mt-1 text-sm text-neutral-500 font-[family-name:var(--font-inter)]">
            Review and resolve open disputes. You sign each resolution with your Freighter wallet.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-3">
          <StatCard label="Open Disputes" value={stats.open} />
          <StatCard label="Resolved" value={stats.resolved} delay={0.05} />
          <StatCard label="Total Cases" value={stats.total} delay={0.1} />
        </div>

        <div className="flex flex-col gap-4">
          {disputes.map((dispute) => {
            const selectedBid = dispute.case.bids[0];
            const vendorName =
              selectedBid?.vendor.vendorProfile?.businessName || selectedBid?.vendor.email || "N/A";
            const amount = dispute.case.escrow?.amount || "0";

            return (
              <div
                key={dispute.id}
                className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-neutral-900">
                      {parseDiagnosis(dispute.case.diagnosis)}
                    </h3>
                    <p className="text-xs text-neutral-400">ID: {dispute.id}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      dispute.status === "OPEN"
                        ? "bg-red-50 text-red-600"
                        : "bg-green-50 text-green-600"
                    }`}
                  >
                    {dispute.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                      Farmer
                    </p>
                    <p className="text-sm font-semibold text-neutral-700">
                      {maskEmail(dispute.case.farmer.email)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                      Vendor
                    </p>
                    <p className="text-sm font-semibold text-neutral-700">{vendorName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                      Amount
                    </p>
                    <p className="text-sm font-semibold text-neutral-700">{amount} USDC</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                      Raised
                    </p>
                    <p className="text-sm font-semibold text-neutral-700">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-neutral-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    Farmer's Reason
                  </p>
                  <p className="mt-1 text-sm text-neutral-700">{dispute.reason}</p>
                </div>

                {dispute.status === "OPEN" && (
                  <div className="mt-6 border-t border-neutral-100 pt-6">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <button
                        onClick={() => {
                          setSelectedDisputeId(dispute.id);
                          setResolutionType("REFUND_FARMER");
                        }}
                        className={`rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                          selectedDisputeId === dispute.id && resolutionType === "REFUND_FARMER"
                            ? "border-blue-300 bg-blue-50 text-blue-700"
                            : "border-neutral-100 hover:bg-neutral-50"
                        }`}
                      >
                        Full Refund to Farmer
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDisputeId(dispute.id);
                          setResolutionType("SPLIT");
                        }}
                        className={`rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                          selectedDisputeId === dispute.id && resolutionType === "SPLIT"
                            ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                            : "border-neutral-100 hover:bg-neutral-50"
                        }`}
                      >
                        Split Funds
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDisputeId(dispute.id);
                          setResolutionType("RELEASE_VENDOR");
                        }}
                        className={`rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                          selectedDisputeId === dispute.id && resolutionType === "RELEASE_VENDOR"
                            ? "border-green-300 bg-green-50 text-green-700"
                            : "border-neutral-100 hover:bg-neutral-50"
                        }`}
                      >
                        Release to Vendor
                      </button>
                    </div>

                    <AnimatePresence>
                      {selectedDisputeId === dispute.id && resolutionType === "SPLIT" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 grid grid-cols-2 gap-4 overflow-hidden"
                        >
                          <div>
                            <label className="text-xs font-medium text-neutral-500">Farmer %</label>
                            <input
                              type="number"
                              value={farmerPercent}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setFarmerPercent(val);
                                setVendorPercent(100 - val);
                              }}
                              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-100"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-neutral-500">Vendor %</label>
                            <input
                              type="number"
                              value={vendorPercent}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setVendorPercent(val);
                                setFarmerPercent(100 - val);
                              }}
                              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-100"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {selectedDisputeId === dispute.id && error && (
                      <p className="mt-3 text-xs text-red-600">{error}</p>
                    )}

                    <button
                      disabled={
                        selectedDisputeId !== dispute.id ||
                        !resolutionType ||
                        resolvingId === dispute.id
                      }
                      onClick={() => handleResolve(dispute.id)}
                      className="mt-5 w-full rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resolvingId === dispute.id
                        ? resolutionState === "api"
                          ? "Submitting..."
                          : resolutionState === "signing"
                          ? "Sign with Freighter..."
                          : resolutionState === "sending"
                          ? "Sending..."
                          : resolutionState === "success"
                          ? "✅ Resolved"
                          : "Processing..."
                        : "Sign & Resolve with Freighter →"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {disputes.length === 0 && (
            <div className="rounded-3xl border border-dashed border-neutral-200 py-20 text-center">
              <p className="text-sm text-neutral-500">No disputes found.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
