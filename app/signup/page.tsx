"use client";

import { motion, useReducedMotion } from "motion/react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function SignupPage() {
  const reduceMotion = useReducedMotion();

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

              <form className="mt-8 space-y-5">
                <div>
                  <label className="text-sm font-medium text-neutral-700">Email</label>
                  <input
                    type="email"
                    placeholder="you@farm.com"
                    className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#d5ebff]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700">Password</label>
                  <input
                    type="password"
                    placeholder="Create a strong password"
                    className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#d5ebff]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700">Role</label>
                  <select className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-[#d5ebff]">
                    <option>Farmer</option>
                    <option>Vendor</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="w-full rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800"
                >
                  Create account
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
