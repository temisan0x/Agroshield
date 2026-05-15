"use client";

import Nav from "@/components/Nav";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-neutral-100 ${className}`}
    />
  );
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_30px_80px_-60px_rgba(0,0,0,0.5)]">
        <div className="animate-pulse space-y-8 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-4">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-12 w-full rounded-2xl" />
              <Skeleton className="h-5 w-4/5 rounded-full" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-24 rounded-2xl bg-neutral-100" />
              <Skeleton className="h-24 rounded-2xl bg-neutral-100" />
              <Skeleton className="h-24 rounded-2xl bg-neutral-100" />
              <Skeleton className="h-24 rounded-2xl bg-neutral-100" />
            </div>
          </div>
          <div className="grid gap-3 rounded-3xl border border-neutral-200 bg-[#f9f4ee] p-4 md:grid-cols-3">
            <Skeleton className="h-12 rounded-2xl bg-white" />
            <Skeleton className="h-12 rounded-2xl bg-white" />
            <Skeleton className="h-12 rounded-2xl bg-white" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Skeleton className="h-80 rounded-3xl bg-neutral-100" />
            <Skeleton className="h-80 rounded-3xl bg-neutral-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
