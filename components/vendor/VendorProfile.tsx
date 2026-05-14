"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { VendorProfileData, VendorProfilePayload } from "./types";
import StatCard from "./StatCard";
import { requestAccess, getAddress } from "@stellar/freighter-api";

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ProfileFormProps {
  profile: VendorProfileData;
  onSave: (payload: VendorProfilePayload) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function ProfileForm({ profile, onSave, onCancel, saving }: ProfileFormProps) {
  const [form, setForm] = useState<VendorProfilePayload>({
    businessName: profile.businessName ?? "",
    bio: profile.bio ?? "",
    specialization: profile.specialization ?? "",
    experienceYears: profile.experienceYears ?? undefined,
    location: profile.location ?? "",
    phone: profile.phone ?? "",
  });

  const set = (key: keyof VendorProfilePayload, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Business name */}
      <div>
        <label className="text-sm font-medium text-neutral-700">
          Business Name
        </label>
        <input
          type="text"
          value={form.businessName ?? ""}
          onChange={(e) => set("businessName", e.target.value)}
          className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#c7f1d2]"
          placeholder="Your business name"
        />
      </div>

      {/* Specialization */}
      <div>
        <label className="text-sm font-medium text-neutral-700">
          Specialization
        </label>
        <input
          type="text"
          value={form.specialization ?? ""}
          onChange={(e) => set("specialization", e.target.value)}
          className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#c7f1d2]"
          placeholder="e.g. Fungal & bacterial crop disease treatment"
        />
      </div>

      {/* Experience + Location */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-neutral-700">
            Years of Experience
          </label>
          <input
            type="number"
            min="0"
            value={form.experienceYears ?? ""}
            onChange={(e) =>
              set("experienceYears", e.target.value ? Number(e.target.value) : 0)
            }
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#c7f1d2]"
            placeholder="e.g. 8"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">
            Location
          </label>
          <input
            type="text"
            value={form.location ?? ""}
            onChange={(e) => set("location", e.target.value)}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#c7f1d2]"
            placeholder="e.g. Nsukka, Enugu"
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="text-sm font-medium text-neutral-700">Phone</label>
        <input
          type="tel"
          value={form.phone ?? ""}
          onChange={(e) => set("phone", e.target.value)}
          className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#c7f1d2]"
          placeholder="+234..."
        />
      </div>

      {/* Bio */}
      <div>
        <label className="text-sm font-medium text-neutral-700">Bio</label>
        <textarea
          rows={4}
          value={form.bio ?? ""}
          onChange={(e) => set("bio", e.target.value)}
          className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#c7f1d2]"
          placeholder="Tell farmers about your services..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-2xl border border-neutral-200 bg-[#F5F0EB] px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VendorProfile() {
  const reduceMotion = useReducedMotion();
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("agroshield_token");
      const res = await fetch("/api/vendors/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setProfile(data.profile ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (payload: VendorProfilePayload) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("agroshield_token");
      const res = await fetch("/api/vendors/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const data = await res.json();
      setProfile(data.profile);
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleConnectWallet = useCallback(async () => {
    setConnectingWallet(true);
    setWalletError(null);

    const token = localStorage.getItem("agroshield_token");
    if (!token) {
      setWalletError("Please log in to connect your wallet.");
      setConnectingWallet(false);
      return;
    }

    try {
      const access = await requestAccess();
      if (access.error) {
        throw new Error(access.error.message ?? "Failed to request access.");
      }

      const { address } = await getAddress();

      if (!address) {
        throw new Error("Failed to retrieve wallet address from Freighter.");
      }

      const response = await fetch("/api/profile/wallet", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = (await response.json()) as { success?: boolean; walletAddress?: string; error?: string };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to save wallet address.");
      }

      setProfile((prev: VendorProfileData | null) => prev ? { ...prev, walletAddress: data.walletAddress ?? null } : null);
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : "Failed to connect wallet.");
    } finally {
      setConnectingWallet(false);
    }
  }, []);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
      </div>
    );
  }

  // ── Error state ──
  if (error && !profile) {
    return (
      <div className="mx-auto max-w-md py-32 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8">
          <p className="text-sm font-semibold text-red-700">
            Error loading profile
          </p>
          <p className="mt-1 text-xs text-red-500">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchProfile();
            }}
            className="mt-4 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const joined = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-NG", {
        month: "short",
        year: "numeric",
      })
    : "—";

  const initial = profile?.businessName?.[0]?.toUpperCase() ?? "V";

  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* ── Profile Card ── */}
      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_30px_80px_-60px_rgba(0,0,0,0.4)]"
      >
        {/* Decorative blobs */}
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-16 translate-x-16 rounded-full bg-[#c7f1d2] opacity-60 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-52 w-52 -translate-x-12 translate-y-12 rounded-full bg-[#f1dcc7] opacity-70 blur-2xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left: identity */}
          <section className="border-neutral-100 bg-[#F9F4EE] px-10 py-12 lg:border-r">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[#0f6b2f] text-2xl font-bold text-white">
                {initial}
              </div>
              <div>
                <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-neutral-900">
                  {profile?.businessName || "Your Business"}
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  {profile?.specialization || "No specialization set"}
                </p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  {profile?.location || "No location"} ·{" "}
                  {profile?.experienceYears
                    ? `${profile.experienceYears} years experience`
                    : "Experience not set"}{" "}
                  · Joined {joined}
                </p>
              </div>
            </div>

            {/* Bio / Edit form */}
            <div className="mt-6">
              {editMode && profile ? (
                <ProfileForm
                  profile={profile}
                  onSave={handleSave}
                  onCancel={() => setEditMode(false)}
                  saving={saving}
                />
              ) : (
                <div>
                  <p className="text-sm leading-relaxed text-neutral-600">
                    {profile?.bio || "No bio added yet. Click edit to add one."}
                  </p>
                  {profile?.phone && (
                    <p className="mt-2 text-xs text-neutral-400">
                      📞 {profile.phone}
                    </p>
                  )}
                  <button
                    onClick={() => setEditMode(true)}
                    className="mt-3 text-xs text-neutral-400 underline transition hover:text-neutral-600"
                  >
                    Edit profile
                  </button>
                </div>
              )}
            </div>

            {/* Nav to cases */}
            <a
              href="/vendor/cases"
              className="mt-6 block w-full rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-center text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              Browse open cases →
            </a>
          </section>

          {/* Right: stats */}
          <section className="px-10 py-12">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              Profile Details
            </p>
<div className="mt-4 grid grid-cols-2 gap-3">
               <StatCard
                 label="Experience"
                 value={
                   profile?.experienceYears
                     ? `${profile.experienceYears} yrs`
                     : "—"
                 }
                 delay={0.1}
               />
               <StatCard
                 label="Location"
                 value={profile?.location || "—"}
                 delay={0.15}
               />
               <StatCard
                 label="Specialization"
                 value={profile?.specialization || "—"}
                 delay={0.2}
               />
               <StatCard
                 label="Joined"
                 value={joined}
                 delay={0.25}
               />
             </div>

             {/* Wallet connection */}
             <div className="mt-4">
               {profile?.walletAddress ? (
                 <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                   <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                     Wallet
                   </div>
                   <div className="mt-1 break-all font-[family-name:var(--font-manrope)] text-sm font-semibold text-neutral-900">
                     {profile.walletAddress}
                   </div>
                 </div>
               ) : (
                 <button
                   type="button"
                   onClick={handleConnectWallet}
                   disabled={connectingWallet}
                   className="w-full rounded-2xl border border-neutral-200 bg-[#16a34a] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-70"
                 >
                   {connectingWallet ? "Connecting..." : "Connect Wallet"}
                 </button>
               )}
               {walletError ? (
                 <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                   {walletError}
                 </div>
               ) : null}
             </div>

            {/* Completion indicator */}
            {profile && (
              <div className="mt-6 rounded-2xl border border-neutral-200 bg-[#F9F4EE] p-4">
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Profile completeness</span>
                  <span className="font-semibold text-neutral-900">
                    {getCompleteness(profile)}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getCompleteness(profile)}%` }}
                    transition={{
                      duration: 0.8,
                      delay: 0.4,
                      ease: "easeOut",
                    }}
                    className="h-full rounded-full bg-[#0f6b2f]"
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      </motion.div>

      {/* Save error toast */}
      {error && profile && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-3 text-xs text-red-600"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCompleteness(p: VendorProfileData): number {
  const fields = [
    p.businessName,
    p.bio,
    p.specialization,
    p.experienceYears,
    p.location,
    p.phone,
  ];
  const filled = fields.filter((f) => f != null && f !== "").length;
  return Math.round((filled / fields.length) * 100);
}
