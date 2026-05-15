"use client";

import {
  useState,
  useEffect,
  useCallback,
  type FormEvent,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import type { VendorProfileData, VendorProfilePayload } from "@/app/vendor/profile/types";
import { connectFreighterWallet } from "@/lib/freighter-wallet";
import StatCard from "./StatCard";

type ProfileFieldValue = VendorProfilePayload[keyof VendorProfilePayload];

type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  label?: string;
  value: string | number | undefined;
  onChange: (value: ProfileFieldValue) => void;
  placeholder?: string;
};

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> & {
  label?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
};

interface ProfileFormProps {
  profile: VendorProfileData;
  onSave: (payload: VendorProfilePayload) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function TextInput({ label, value, onChange, type = "text", placeholder, ...props }: TextInputProps) {
  return (
    <div>
      {label && <label className="mb-1 block text-sm font-medium text-neutral-700">{label}</label>}
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => {
          const val =
            type === "number"
              ? e.target.value === ""
                ? undefined
                : Number(e.target.value)
              : e.target.value;
          onChange(val);
        }}
        className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#c7f1d2]"
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 4, ...props }: TextAreaProps) {
  return (
    <div>
      {label && <label className="mb-1 block text-sm font-medium text-neutral-700">{label}</label>}
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#c7f1d2]"
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
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

  const update = useCallback(
    (key: keyof VendorProfilePayload, value: ProfileFieldValue) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <TextInput
        label="Business Name"
        value={form.businessName}
        onChange={(v) => update("businessName", v)}
        placeholder="Your business name"
      />
      <TextInput
        label="Specialization"
        value={form.specialization}
        onChange={(v) => update("specialization", v)}
        placeholder="e.g. Fungal & bacterial crop disease treatment"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Years of Experience"
          type="number"
          min={0}
          value={form.experienceYears}
          onChange={(v) => update("experienceYears", v)}
          placeholder="e.g. 8"
        />
        <TextInput
          label="Location"
          value={form.location}
          onChange={(v) => update("location", v)}
          placeholder="e.g. Nsukka, Enugu"
        />
      </div>
      <TextInput
        label="Phone"
        type="tel"
        value={form.phone}
        onChange={(v) => update("phone", v)}
        placeholder="+234..."
      />
      <TextArea
        label="Bio"
        value={form.bio}
        onChange={(v) => update("bio", v)}
        placeholder="Tell farmers about your services..."
      />
      <div className="flex gap-3 pt-2">
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
          className="flex-1 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function getCompleteness(p: VendorProfileData | null): number {
  if (!p) return 0;
  const fields = [p.businessName, p.bio, p.specialization, p.experienceYears, p.location, p.phone];
  return Math.round((fields.filter((f) => f != null && f !== "").length / fields.length) * 100);
}

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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchProfile();
    });
  }, [fetchProfile]);

  const handleSave = useCallback(async (payload: VendorProfilePayload) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("agroshield_token");
      const res = await fetch("/api/vendors/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const data = await res.json();
      setProfile(data.profile);
      setEditMode(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }, []);

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
      const { requestAccess, getAddress } = await import("@stellar/freighter-api");
      const access = await requestAccess();
      if (access.error) {
        throw new Error(access.error.message ?? "Failed to request access.");
      }

      const helperAddress = await connectFreighterWallet().catch(() => null);
      const address = access.address ?? (await getAddress()).address ?? helperAddress;
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

      const data = (await response.json()) as {
        success?: boolean;
        walletAddress?: string;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to save wallet address.");
      }

      setProfile((prev) => (prev ? { ...prev, walletAddress: data.walletAddress ?? null } : null));
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : "Failed to connect wallet.");
    } finally {
      setConnectingWallet(false);
    }
  }, []);

  const businessInitial = profile?.businessName?.[0]?.toUpperCase() ?? "V";
  const joined = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-NG", { month: "short", year: "numeric" })
    : "—";
  const completeness = getCompleteness(profile);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0EB]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0EB]">
        <div className="text-center">
          <p className="font-medium text-red-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchProfile();
            }}
            className="mt-4 rounded-2xl bg-neutral-900 px-4 py-2 text-sm text-white"
          >
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
        className="relative overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_30px_80px_-60px_rgba(0,0,0,0.4)]"
      >
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-16 translate-x-16 rounded-full bg-[#c7f1d2] opacity-60 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-52 w-52 -translate-x-12 translate-y-12 rounded-full bg-[#f1dcc7] opacity-70 blur-2xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="border-neutral-100 bg-[#F9F4EE] px-10 py-12 lg:border-r">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[#0f6b2f] text-2xl font-bold text-white">
                {businessInitial}
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

            <div className="mt-6">
              {editMode && profile ? (
                <ProfileForm
                  profile={profile}
                  onSave={handleSave}
                  onCancel={() => setEditMode(false)}
                  saving={saving}
                />
              ) : (
                <div className="mt-8 space-y-3">
                  <p className="text-sm leading-relaxed text-neutral-600">
                    {profile?.bio || "No bio added yet. Click edit to add one."}
                  </p>
                  {profile?.phone ? <p className="text-xs text-neutral-400">📞 {profile.phone}</p> : null}
                  <button
                    onClick={() => setEditMode(true)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
                  >
                    ✏️ Edit profile
                  </button>
                </div>
              )}
            </div>

            <Link
              href="/vendor/cases"
              className="mt-6 block w-full rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-center text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              Browse open cases →
            </Link>
          </section>

          <section className="px-10 py-12">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Profile Details</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatCard
                label="Experience"
                value={profile?.experienceYears ? `${profile.experienceYears} yrs` : "—"}
                delay={0.1}
              />
              <StatCard label="Location" value={profile?.location || "—"} delay={0.15} />
              <StatCard
                label="Specialization"
                value={profile?.specialization || "—"}
                delay={0.2}
              />
              <StatCard label="Joined" value={joined} delay={0.25} />
            </div>

            <div className="mt-4">
              {profile?.walletAddress ? (
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Wallet</div>
                  <div className="mt-1 break-all font-[family-name:var(--font-manrope)] text-sm font-semibold text-neutral-900">
                    {profile.walletAddress}
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">
                    Network label hint: connect the same Freighter account you use on Trustless Work testnet.
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Re-confirm this wallet before accepting escrow actions if you switch browser accounts.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleConnectWallet}
                    disabled={connectingWallet}
                    className="w-full rounded-2xl border border-neutral-200 bg-[#16a34a] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {connectingWallet ? "Connecting..." : "Connect Wallet"}
                  </button>
                  <p className="text-xs text-neutral-500">
                    Network label hint: use your Freighter testnet wallet for AgroShield escrow actions.
                  </p>
                  <p className="text-xs text-neutral-400">
                    Wallet re-confirm note: if the popup shows a different account than expected, cancel and reconnect.
                  </p>
                </div>
              )}
              {walletError ? (
                <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                  {walletError}
                </div>
              ) : null}
            </div>

            {profile ? (
              <div className="mt-6 rounded-2xl border border-neutral-200 bg-[#F9F4EE] p-4">
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Profile completeness</span>
                  <span className="font-semibold text-neutral-900">{completeness}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completeness}%` }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    className="h-full rounded-full bg-[#0f6b2f]"
                  />
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </motion.div>

      {error && profile ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-3 text-xs text-red-600"
        >
          {error}
        </motion.div>
      ) : null}
    </div>
  );
}
