"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

const fallbackAvatar = (
  <svg viewBox="0 0 40 40" aria-hidden="true" className="h-9 w-9 text-neutral-400">
    <rect width="40" height="40" rx="20" fill="currentColor" opacity="0.2" />
    <circle cx="20" cy="15" r="6" fill="currentColor" opacity="0.55" />
    <path
      d="M8 33c2.5-6.5 8-9.5 12-9.5s9.5 3 12 9.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

export default function Nav() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("agroshield_token");
    setIsAuthed(Boolean(token));
    setHydrated(true);
  }, []);

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
            {hydrated && !isAuthed ? (
              <a className="transition hover:text-white" href="/login">
                Log in
              </a>
            ) : null}
          </div>
          {hydrated && !isAuthed ? (
            <a
              className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-neutral-900"
              href="/signup"
            >
              Get started
            </a>
          ) : null}
          {hydrated && isAuthed ? (
            <div className="flex items-center gap-3 text-sm text-neutral-100">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                {fallbackAvatar}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </motion.nav>
  );
}
