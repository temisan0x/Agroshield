"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";
import { useAuthStatus, useHydrated } from "@/lib/auth-client";

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

function Nav() {
  const isAuthed = useAuthStatus();
  const hydrated = useHydrated();
  const pathname = usePathname();

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
          <div className="hidden items-center gap-6 text-sm text-neutral-300 md:flex">
            <Link className="transition hover:text-white" href="/#how">
              How it works
            </Link>
            <Link className="transition hover:text-white" href="/#farmers">
              For Farmers
            </Link>
            <Link className="transition hover:text-white" href="/#vendors">
              For Vendors
            </Link>
            <Link
              className={`transition hover:text-white ${pathname === "/marketplace" ? "text-white" : ""}`}
              href="/marketplace"
            >
              Marketplace
            </Link>
            <Link
              className={`transition hover:text-white ${pathname === "/diagnose" ? "text-white" : ""}`}
              href="/diagnose"
            >
              Diagnose
            </Link>
            {hydrated && isAuthed ? (
              <Link
                className={`transition hover:text-white ${pathname === "/profile" ? "text-white" : ""}`}
                href="/profile"
              >
                Profile
              </Link>
            ) : null}
            {hydrated && !isAuthed ? (
              <Link className="transition hover:text-white" href="/login">
                Log in
              </Link>
            ) : null}
          </div>
          {hydrated && !isAuthed ? (
            <Link className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-neutral-900" href="/signup">
              Get started
            </Link>
          ) : null}
          {hydrated && isAuthed ? (
            <div className="flex items-center gap-3 text-sm text-neutral-100">
              <Link
                href="/profile"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/15"
                aria-label="Open profile"
                title="Open profile"
              >
                {fallbackAvatar}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

export default memo(Nav);
