"use client";

import Nav from "@/components/Nav";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-stone-100 ${className}`}
    />
  );
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="overflow-hidden">
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
          <div className="grid gap-3 p-4 md:grid-cols-3">
            <Skeleton className="h-12 rounded-2xl bg-[#fcfaf8]/60" />
            <Skeleton className="h-12 rounded-2xl bg-[#fcfaf8]/60" />
            <Skeleton className="h-12 rounded-2xl bg-[#fcfaf8]/60" />
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
