"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useAuthStatus, useHydrated } from "@/lib/auth-client";

export default function DiagnosePage() {
  const reduceMotion = useReducedMotion();
  const isAuthed = useAuthStatus();
  const hydrated = useHydrated();
  const [freeRemaining, setFreeRemaining] = useState(3);
  const [showGate, setShowGate] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  const canRun = useMemo(() => (isAuthed ? true : freeRemaining > 0), [isAuthed, freeRemaining]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setDiagnosis(null);
    setError(null);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const fileToBase64 = (file: File) =>
    new Promise<{ base64: string; mimeType: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result?.toString() ?? "";
        const parts = result.split(",");
        if (parts.length < 2) {
          reject(new Error("Invalid image data"));
          return;
        }
        resolve({ base64: parts[1], mimeType: file.type || "image/jpeg" });
      };
      reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleRun = async () => {
    if (!canRun) {
      setShowGate(true);
      setShowSignupPrompt(true);
      return;
    }

    if (!selectedFile) {
      setError("Please upload a crop photo first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowGate(false);

    try {
      const { base64, mimeType } = await fileToBase64(selectedFile);
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      const data = (await response.json()) as { diagnosis?: Record<string, unknown> };
      if (!response.ok || !data.diagnosis) {
        throw new Error("Diagnosis failed. Please try again.");
      }

      setDiagnosis(data.diagnosis);
      setFreeRemaining((value) => Math.max(0, value - 1));
      if (freeRemaining <= 1) {
        setShowSignupPrompt(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Nav />
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-neutral-100 bg-white p-8 shadow-sm md:p-10"
          >
            <div className="inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-[#16a34a]">
              AI Diagnosis
            </div>
            <h1 className="mt-4 font-[family-name:var(--font-manrope)] text-4xl font-bold text-neutral-900">
              Diagnose your crop in seconds
            </h1>
            <p className="mt-3 font-[family-name:var(--font-inter)] text-base text-neutral-500">
              Upload a photo and get an instant disease report. The first 3 diagnoses are free — no
              sign-in required.
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="block rounded-2xl border border-dashed border-neutral-200 bg-[#F5F0EB] p-8 text-center">
                  <div className="text-sm text-neutral-500">
                    Drop your crop photo here or click to upload
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <span className="mt-4 inline-flex rounded-full bg-neutral-900 px-6 py-2 text-sm text-white">
                    Upload image
                  </span>
                </label>

                {previewUrl ? (
                  <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-100">
                    <img alt="Crop preview" src={previewUrl} className="w-full object-cover" />
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleRun}
                    className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Analyzing..." : "Run diagnosis"}
                  </button>
                  {hydrated && !isAuthed ? (
                    <a className="text-sm text-neutral-500 underline" href="/signup">
                      Create account for unlimited use
                    </a>
                  ) : null}
                </div>

                {error ? (
                  <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                    {error}
                  </div>
                ) : null}

                {showGate ? (
                  <div className="mt-6 rounded-2xl border border-neutral-100 bg-white p-4 text-sm text-neutral-500">
                    You have used all free diagnoses. Please log in to continue.
                  </div>
                ) : null}

                {diagnosis ? (
                  <div className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5 text-sm text-neutral-600">
                    <div className="text-xs uppercase tracking-wide text-neutral-400">Diagnosis</div>
                    <div className="mt-2 font-[family-name:var(--font-manrope)] text-lg text-neutral-900">
                      {String(diagnosis.disease ?? "Unknown issue")}
                    </div>
                    <div className="mt-2 text-sm text-neutral-500">
                      Confidence: {String(diagnosis.confidence ?? "-")}%
                    </div>
                    <div className="mt-4 grid gap-2 text-xs text-neutral-500 md:grid-cols-2">
                      <div>Urgency: {String(diagnosis.urgency ?? "-")}</div>
                      <div>Recovery days: {String(diagnosis.recovery_days ?? "-")}</div>
                      <div>Caused by: {String(diagnosis.caused_by ?? "-")}</div>
                      <div>Pesticide: {String(diagnosis.pesticide ?? "-")}</div>
                    </div>
                    <div className="mt-3 text-sm text-neutral-500">
                      Symptoms: {String(diagnosis.symptoms ?? "-")}
                    </div>
                    <div className="mt-2 text-sm text-neutral-500">
                      Treatment: {String(diagnosis.treatment ?? "-")}
                    </div>
                    <div className="mt-2 text-sm text-neutral-500">
                      Preventive measures: {String(diagnosis.preventive_measures ?? "-")}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="h-fit self-start rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
                <div className="text-xs text-neutral-400">Free diagnoses remaining</div>
                <div className="mt-2 font-[family-name:var(--font-manrope)] text-3xl font-bold text-neutral-900">
                  {isAuthed ? "Unlimited" : freeRemaining}
                </div>
                <div className="mt-4 text-sm text-neutral-500">
                  {isAuthed
                    ? "You are signed in and can run unlimited diagnoses."
                    : "After the free limit, sign in to unlock unlimited diagnoses and escrow tools."}
                </div>
                {hydrated && !isAuthed ? (
                  <a
                    className="mt-6 inline-flex rounded-full bg-[#16a34a] px-4 py-2 text-xs font-semibold text-white"
                    href="/login"
                  >
                    Log in
                  </a>
                ) : null}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      {showSignupPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6">
          <div className="w-full max-w-md rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-neutral-400">Create account</div>
            <h2 className="mt-2 font-[family-name:var(--font-manrope)] text-2xl font-bold text-neutral-900">
              Unlock unlimited diagnoses
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              You have used the free diagnoses. Create an account to keep analyzing crops and
              access escrow tools.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/signup"
                className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white"
              >
                Create account
              </a>
              <button
                onClick={() => setShowSignupPrompt(false)}
                className="rounded-full border border-neutral-200 px-5 py-2 text-sm text-neutral-600"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}
