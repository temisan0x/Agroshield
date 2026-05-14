"use client";

import {
  useState,
  useEffect,
  useCallback,
  type FormEvent,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import type { VendorProfileData, VendorProfilePayload } from "@/app/vendor/profile/types";
import StatCard from "./StatCard";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// ==================== TYPES ====================

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

// ==================== FORM INPUTS ====================

function TextInput({ label, value, onChange, type = "text", placeholder, ...props }: TextInputProps) {
  return (
    <div>
      {label && <label className="text-sm font-medium text-neutral-700 mb-1 block">{label}</label>}
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
      {label && <label className="text-sm font-medium text-neutral-700 mb-1 block">{label}</label>}
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

// ==================== PROFILE FORM ====================

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
    []
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <TextInput label="Business Name" value={form.businessName} onChange={(v) => update("businessName", v)} placeholder="Your business name" />
      <TextInput label="Specialization" value={form.specialization} onChange={(v) => update("specialization", v)} placeholder="e.g. Fungal & bacterial crop disease treatment" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Years of Experience" type="number" min={0} value={form.experienceYears} onChange={(v) => update("experienceYears", v)} placeholder="e.g. 8" />
        <TextInput label="Location" value={form.location} onChange={(v) => update("location", v)} placeholder="e.g. Nsukka, Enugu" />
      </div>
      <TextInput label="Phone" type="tel" value={form.phone} onChange={(v) => update("phone", v)} placeholder="+234..." />
      <TextArea label="Bio" value={form.bio} onChange={(v) => update("bio", v)} placeholder="Tell farmers about your services..." />
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-2xl border border-neutral-200 bg-[#F5F0EB] px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="flex-1 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:opacity-70">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// ==================== UTILS ====================

function getCompleteness(p: VendorProfileData | null): number {
  if (!p) return 0;
  const fields = [p.businessName, p.bio, p.specialization, p.experienceYears, p.location, p.phone];
  return Math.round((fields.filter((f) => f != null && f !== "").length / fields.length) * 100);
}

// ==================== MAIN COMPONENT ====================

export default function VendorProfile() {
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

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
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

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
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
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
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); fetchProfile(); }} className="mt-4 rounded-2xl bg-neutral-900 px-4 py-2 text-sm text-white">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[calc(100vh-140px)] bg-[#F5F0EB] pt-28 pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_30px_80px_-60px_rgba(0,0,0,0.4)]">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">

              <section className="bg-[#F9F4EE] px-10 py-12 lg:border-r border-neutral-100">
                <div className="flex items-start gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0f6b2f] text-white font-bold text-2xl">
                    {businessInitial}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-neutral-900">{profile?.businessName || "Your Business"}</h1>
                    <p className="text-sm text-neutral-500 mt-1">{profile?.specialization || "No specialization set"}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {profile?.location || "No location"} ·{" "}
                      {profile?.experienceYears ? `${profile.experienceYears} years experience` : "Experience not set"} · Joined {joined}
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {editMode && profile ? (
                    <ProfileForm profile={profile} onSave={handleSave} onCancel={() => setEditMode(false)} saving={saving} />
                  ) : (
                    <>
                      <p className="text-sm text-neutral-600">{profile?.bio || "No bio added yet. Click edit to add one."}</p>
                      {profile?.phone && <p className="text-xs text-neutral-400">📞 {profile.phone}</p>}
                      <button
                        onClick={() => setEditMode(true)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
                      >
                        ✏️ Edit profile
                      </button>
                    </>
                  )}
                </div>
              </section>

              <section className="px-10 py-12">
                <p className="text-xs uppercase tracking-widest text-neutral-400">Profile Details</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <StatCard label="Experience" value={profile?.experienceYears ? `${profile.experienceYears} yrs` : "—"} />
                  <StatCard label="Location" value={profile?.location || "—"} />
                  <StatCard label="Specialization" value={profile?.specialization || "—"} />
                  <StatCard label="Joined" value={joined} />
                </div>
                <div className="mt-8">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-neutral-500">Profile completeness</span>
                    <span className="font-semibold text-neutral-900">{completeness}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                    <div className="h-full bg-[#0f6b2f] rounded-full transition-all" style={{ width: `${completeness}%` }} />
                  </div>
                </div>
              </section>

            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">{error}</div>
          )}
        </div>
      </div>
    </>
  );
}