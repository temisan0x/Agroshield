"use client";

import { motion, useReducedMotion } from "motion/react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Nav />
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-xl rounded-2xl border border-neutral-100 bg-white p-10 shadow-sm"
          >
            <div className="inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-[#16a34a]">
              Welcome back
            </div>
            <h1 className="mt-4 font-[family-name:var(--font-manrope)] text-4xl font-bold text-neutral-900">
              Log in to AgroShield
            </h1>
            <p className="mt-3 font-[family-name:var(--font-inter)] text-base text-neutral-500">
              Access your cases, bids, and escrow status.
            </p>

            <form className="mt-8 space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700">Email</label>
                <input
                  type="email"
                  placeholder="you@farm.com"
                  className="mt-2 w-full rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                />
              </div>
              <button
                type="button"
                className="w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white md:text-base"
              >
                Log in
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-500">
              New to AgroShield?{" "}
              <a className="text-neutral-900 underline" href="/signup">
                Create an account
              </a>
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-100 bg-[#F5F0EB] p-4 text-xs text-neutral-500">
              No account required for the first 3 diagnoses. Log in once you hit the free limit.
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
