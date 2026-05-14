"use client";

import { motion } from "motion/react";

export default function Nav() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-6 left-0 right-0 z-50"
    >
      <div className="mx-auto w-full max-w-4xl px-6">
        <div className="flex items-center justify-between rounded-full bg-neutral-900/90 px-5 py-3 text-white shadow-sm backdrop-blur">
          <a
            href="/"
            className="flex items-center gap-3 font-[family-name:var(--font-manrope)] text-sm"
          >
            <span className="h-3 w-3 rounded-sm bg-[#16a34a]" />
            <span className="font-semibold tracking-wide">AgroShield</span>
          </a>
          <div className="hidden items-center gap-6 text-sm text-neutral-300 md:flex">
            <a className="transition hover:text-white" href="/#how">
              How it works
            </a>
            <a className="transition hover:text-white" href="/#farmers">
              For Farmers
            </a>
            <a className="transition hover:text-white" href="/#vendors">
              For Vendors
            </a>
            <a className="transition hover:text-white" href="/diagnose">
              Diagnose
            </a>
            <a className="transition hover:text-white" href="/login">
              Log in
            </a>
          </div>
          <a
            className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-neutral-900"
            href="/signup"
          >
            Get started
          </a>
        </div>
      </div>
    </motion.nav>
  );
}
