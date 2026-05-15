"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";

const fallbackAvatar = (
  <svg
    viewBox="0 0 40 40"
    aria-hidden="true"
    className="h-9 w-9 text-neutral-400"
  >
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

type UserRole = "FARMER" | "VENDOR" | null;

export default function Nav() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("agroshield_token");

      if (!token) {
        setHydrated(true);
        return;
      }

      const payload = JSON.parse(atob(token.split(".")[1]));

      setIsAuthed(true);
      setRole(payload?.role ?? null);
    } catch (error) {
      console.error("[NAV_AUTH_PARSE]", error);

      localStorage.removeItem("agroshield_token");

      setIsAuthed(false);
      setRole(null);
    } finally {
      setHydrated(true);
    }
  }, []);

  const profileRoute =
    role === "VENDOR" ? "/vendor/profile" : "/farmer/profile";

  return (
    <nav className="fixed top-6 left-0 right-0 z-50">
      <div className="mx-auto w-full max-w-4xl px-6">
        <div className="flex items-center justify-between rounded-full bg-neutral-900/90 px-5 py-3 text-white shadow-sm backdrop-blur">
          <Link
            href="/"
            className="flex items-center gap-3 font-[family-name:var(--font-manrope)] text-sm"
          >
            <span className="h-3 w-3 rounded-sm bg-[#16a34a]" />
            <span className="font-semibold tracking-wide">AgroShield</span>
          </Link>

          {/* Replace the static nav links with role-aware ones */}
          <div className="hidden items-center gap-6 text-sm text-neutral-300 md:flex">
            <Link href="/#how" className="transition hover:text-white">
              How it works
            </Link>
            <Link href="/diagnose" className="transition hover:text-white">
              Diagnose
            </Link>

            {hydrated && isAuthed && role === "VENDOR" && (
              <>
                <Link
                  href="/vendor/cases"
                  className="transition hover:text-white"
                >
                  Browse Cases
                </Link>
                <Link
                  href="/vendor/bids"
                  className="transition hover:text-white"
                >
                  My Bids
                </Link>
              </>
            )}

            {hydrated && isAuthed && role === "FARMER" && (
              <>
                <Link
                  href="/farmer/cases"
                  className="transition hover:text-white"
                >
                  My Cases
                </Link>
              </>
            )}

            {hydrated && !isAuthed && (
              <Link href="/login" className="transition hover:text-white">
                Log in
              </Link>
            )}
          </div>

          {hydrated && !isAuthed && (
            <Link
              href="/signup"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-neutral-900 cursor-pointer"
            >
              Get started
            </Link>
          )}

          {hydrated && isAuthed && (
            <Link href={profileRoute} className="cursor-pointer">
              {fallbackAvatar}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default memo(Nav);
