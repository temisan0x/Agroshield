"use client";

import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";

interface BidModalProps {
  caseId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BidModal({ caseId, onClose, onSuccess }: BidModalProps) {
  const reduceMotion = useReducedMotion();
  const [amount, setAmount] = useState("");
  const [proposal, setProposal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !proposal) {
      setError("Amount and proposal are required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const token = localStorage.getItem("agroshield_token");
      const res = await fetch("/api/bids/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caseId, amount: Number(amount), proposal }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit bid.");
      }
      setDone(true);
      onSuccess?.();
      setTimeout(onClose, 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={
          reduceMotion
            ? { opacity: 1 }
            : { opacity: 0, y: 24, scale: 0.97 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-2xl"
      >
        {/* Decorative blob */}
        <div className="absolute right-0 top-0 h-40 w-40 -translate-y-8 translate-x-8 rounded-full bg-[#c7f1d2] opacity-50 blur-2xl" />

        <div className="relative px-8 py-8">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-6 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
                  ✓
                </div>
                <p className="text-lg font-bold text-neutral-900">
                  Bid submitted!
                </p>
                <p className="text-sm text-neutral-500">
                  The farmer will review your proposal shortly.
                </p>
              </motion.div>
            ) : (
              <motion.div key="form">
                <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-neutral-900">
                  Submit a Bid
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Propose your treatment price and approach.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="text-sm font-medium text-neutral-700">
                      Amount (USD)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="e.g. 45"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#c7f1d2]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-700">
                      Treatment Proposal
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Describe your treatment approach, chemicals, timeline..."
                      value={proposal}
                      onChange={(e) => setProposal(e.target.value)}
                      className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#c7f1d2]"
                    />
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 rounded-2xl border border-neutral-200 bg-[#F5F0EB] px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submitting ? "Submitting…" : "Submit bid"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
