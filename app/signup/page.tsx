"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { notifyAuthChange } from "@/lib/auth-client";

export default function SignupPage() {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("Farmer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role: role.toUpperCase(),
        }),
      });

      const data = (await response.json()) as { token?: string; error?: string };
      if (!response.ok || !data.token) {
        throw new Error(data.error ?? "Signup failed. Please try again.");
      }

      localStorage.setItem("agroshield_token", data.token);
      notifyAuthChange();
      router.push("/diagnose");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Signup failed.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Nav />
      <main className="pt-28 pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative grid gap-10 overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_30px_80px_-60px_rgba(0,0,0,0.5)] lg:grid-cols-[0.95fr_1.05fr]"
          >
            <div className="absolute right-0 top-0 h-52 w-52 -translate-y-12 translate-x-12 rounded-full bg-[#d5ebff] opacity-70 blur-2xl" />
            <div className="absolute bottom-0 left-0 h-52 w-52 -translate-x-12 translate-y-12 rounded-full bg-[#f1dcc7] opacity-80 blur-2xl" />

            <section className="relative z-10 px-10 py-12">
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-semibold text-neutral-900">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Unlock unlimited diagnoses, verified vendor support, and escrow protection.
              </p>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm font-medium text-neutral-700">Email</label>
                  <input
                    type="email"
                    placeholder="you@farm.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#d5ebff]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700">Password</label>
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 pr-12 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#d5ebff]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-neutral-400 transition hover:text-neutral-600"
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                          <path
                            d="M3 3l18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M10.58 10.59a3 3 0 004.24 4.24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M9.88 5.09A10.45 10.45 0 0112 4.8c5.5 0 9.5 4.2 10.4 7.2a1.2 1.2 0 010 .8c-.45 1.48-1.5 3.15-3 4.54"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M6.23 6.23C4.17 7.66 2.94 9.57 2.6 10.8a1.2 1.2 0 000 .8C3.5 14.6 7.5 18.8 13 18.8c1.2 0 2.3-.16 3.33-.46"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                          <path
                            d="M2.6 12c1-3 5-7.2 9.4-7.2S20.4 9 21.4 12c-1 3-5 7.2-9.4 7.2S3.6 15 2.6 12Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700">Role</label>
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#d5ebff]"
                  >
                    <option>Farmer</option>
                    <option>Vendor</option>
                  </select>
                </div>
                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                    {error}
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Creating account..." : "Create account"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-neutral-500">
                Already have an account?{" "}
                <a className="text-neutral-900 underline" href="/login">
                  Log in
                </a>
              </div>
            </section>

            <section className="relative z-10 flex h-full flex-col justify-between gap-10 border-neutral-100 bg-[#F9F4EE] px-10 py-12 lg:border-l">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-[#0f6b2f]">
                  Join AgroShield
                </div>
                <h1 className="mt-5 font-[family-name:var(--font-manrope)] text-4xl font-bold text-neutral-900 lg:text-5xl">
                  Diagnose crops, fund fixes, and protect every payout.
                </h1>
                <p className="mt-4 max-w-md font-[family-name:var(--font-inter)] text-base text-neutral-600">
                  AgroShield connects farmers and vendors through transparent escrow workflows and real-time disease triage.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">What you get</p>
                  <p className="mt-3 text-sm text-neutral-600">
                    Unlimited diagnoses, priority vendor bids, and rapid reimbursements when treatments are verified.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-neutral-600">
                  <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Avg. savings</p>
                    <p className="mt-2 text-lg font-semibold text-neutral-900">18%</p>
                  </div>
                  <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Claims</p>
                    <p className="mt-2 text-lg font-semibold text-neutral-900">24h</p>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
