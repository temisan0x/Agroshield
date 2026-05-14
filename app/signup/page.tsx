"use client";

import { motion, useReducedMotion } from "motion/react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function SignupPage() {
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
              Create your account
            </div>
            <h1 className="mt-4 font-[family-name:var(--font-manrope)] text-4xl font-bold text-neutral-900">
              Join AgroShield
            </h1>
            <p className="mt-3 font-[family-name:var(--font-inter)] text-base text-neutral-500">
              Unlock unlimited diagnoses and escrow-protected treatments.
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
                  placeholder="Create a strong password"
                  className="mt-2 w-full rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Role</label>
                <select className="mt-2 w-full rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-700 outline-none transition focus:border-neutral-400">
                  <option>Farmer</option>
                  <option>Vendor</option>
                </select>
              </div>
              <button
                type="button"
                className="w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white md:text-base"
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
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
