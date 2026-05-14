"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";

type MarketplaceListing = {
  id: string;
  imageUrl: string;
  title: string;
  crop: string;
  disease: string;
  urgency: string;
  status: string;
  farmerEmail: string;
  createdAt: string;
  bidCount: number;
  latestBid: string | null;
  lowestBid: string | null;
  summary: string;
};

type MarketplaceBrowserProps = {
  listings: MarketplaceListing[];
};

const statusOptions = [
  { label: "All listings", value: "all" },
  { label: "Open", value: "OPEN" },
  { label: "In progress", value: "IN_PROGRESS" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatCurrency(value: string | null) {
  if (!value) return null;
  const amount = Number(value);
  if (Number.isNaN(amount)) return null;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function MarketplaceBrowser({ listings }: MarketplaceBrowserProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bidFilter, setBidFilter] = useState("all");

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return listings.filter((listing) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          listing.title,
          listing.crop,
          listing.disease,
          listing.summary,
          listing.farmerEmail,
          listing.urgency,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));

      const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
      const matchesBidFilter =
        bidFilter === "all" ||
        (bidFilter === "with-bids" && listing.bidCount > 0) ||
        (bidFilter === "no-bids" && listing.bidCount === 0);

      return matchesQuery && matchesStatus && matchesBidFilter;
    });
  }, [bidFilter, listings, query, statusFilter]);

  const totalListings = listings.length;
  const openListings = listings.filter((listing) => listing.status === "OPEN").length;
  const withBids = listings.filter((listing) => listing.bidCount > 0).length;
  const bidSamples = listings
    .map((listing) => Number(listing.latestBid ?? listing.lowestBid ?? 0))
    .filter((value) => !Number.isNaN(value) && value > 0);
  const avgBid = bidSamples.length > 0 ? bidSamples.reduce((sum, value) => sum + value, 0) / bidSamples.length : 0;

  return (
    <main className="pt-28 pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_30px_80px_-60px_rgba(0,0,0,0.5)]"
        >
          <div className="relative px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="absolute right-0 top-0 h-52 w-52 translate-x-16 -translate-y-16 rounded-full bg-[#d5ebff] opacity-50 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-52 w-52 -translate-x-16 translate-y-16 rounded-full bg-[#c7f1d2] opacity-50 blur-3xl" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <div className="inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-[#16a34a]">
                  Marketplace
                </div>
                <h1 className="mt-4 font-[family-name:var(--font-manrope)] text-4xl font-bold text-neutral-900 md:text-5xl">
                  Discover active crop cases and verified vendor opportunities.
                </h1>
                <p className="mt-4 max-w-2xl text-base text-neutral-500 md:text-lg">
                  Search open cases, review bid activity, and move from crop diagnosis to treatment
                  without leaving the platform.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Listings</div>
                  <div className="mt-2 font-[family-name:var(--font-manrope)] text-3xl font-bold text-neutral-900">
                    {totalListings}
                  </div>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Open</div>
                  <div className="mt-2 font-[family-name:var(--font-manrope)] text-3xl font-bold text-neutral-900">
                    {openListings}
                  </div>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">With bids</div>
                  <div className="mt-2 font-[family-name:var(--font-manrope)] text-3xl font-bold text-neutral-900">
                    {withBids}
                  </div>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:col-span-3 lg:col-span-2">
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Avg. bid</div>
                  <div className="mt-2 font-[family-name:var(--font-manrope)] text-3xl font-bold text-neutral-900">
                    {avgBid ? formatCurrency(String(avgBid)) : "$0"}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 grid gap-3 rounded-3xl border border-neutral-200 bg-[#f9f4ee] p-4 md:grid-cols-[1.5fr_0.75fr_0.75fr]">
              <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                <span className="text-sm text-neutral-400">Search</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Disease, crop, farmer email, urgency"
                  className="w-full bg-transparent text-sm text-neutral-700 outline-none placeholder:text-neutral-300"
                />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                <span className="text-sm text-neutral-400">Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full bg-transparent text-sm text-neutral-700 outline-none"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                <span className="text-sm text-neutral-400">Bids</span>
                <select
                  value={bidFilter}
                  onChange={(event) => setBidFilter(event.target.value)}
                  className="w-full bg-transparent text-sm text-neutral-700 outline-none"
                >
                  <option value="all">All listings</option>
                  <option value="with-bids">With bids</option>
                  <option value="no-bids">No bids yet</option>
                </select>
              </label>
            </div>
          </div>

          <div className="border-t border-neutral-100 px-6 py-8 sm:px-8 lg:px-10">
            {filteredListings.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredListings.map((listing, index) => {
                  const badgeTone =
                    listing.status === "OPEN"
                      ? "bg-[#16a34a]/10 text-[#16a34a]"
                      : "bg-[#c77d15]/10 text-[#a15c0b]";

                  const latestBid = formatCurrency(listing.latestBid);
                  const lowestBid = formatCurrency(listing.lowestBid);

                  return (
                    <motion.article
                      key={listing.id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: index * 0.05 }}
                      className="overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-sm"
                    >
                      <div className="aspect-[16/10] overflow-hidden bg-neutral-100">
                        {listing.imageUrl ? (
                          <img
                            src={listing.imageUrl}
                            alt={listing.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f1dcc7] via-white to-[#d5ebff] text-sm text-neutral-400">
                            Crop image unavailable
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${badgeTone}`}>
                              {listing.status === "OPEN" ? "Open" : "In progress"}
                            </div>
                            <h2 className="mt-3 font-[family-name:var(--font-manrope)] text-xl font-semibold text-neutral-900">
                              {listing.title}
                            </h2>
                          </div>
                          <div className="text-right text-xs text-neutral-400">
                            <div>Posted</div>
                            <div className="mt-1 text-sm text-neutral-600">
                              {formatDate(listing.createdAt)}
                            </div>
                          </div>
                        </div>

                        <p className="text-sm leading-6 text-neutral-500">{listing.summary}</p>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#f5f0eb] px-3 py-1 text-xs text-neutral-600">
                            {listing.crop}
                          </span>
                          <span className="rounded-full bg-[#f5f0eb] px-3 py-1 text-xs text-neutral-600">
                            {listing.urgency}
                          </span>
                          <span className="rounded-full bg-[#f5f0eb] px-3 py-1 text-xs text-neutral-600">
                            {listing.bidCount} bid{listing.bidCount === 1 ? "" : "s"}
                          </span>
                        </div>

                        <div className="grid gap-3 rounded-2xl border border-neutral-100 bg-[#f9f4ee] p-4 text-sm text-neutral-600 sm:grid-cols-2">
                          <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                              Farmer
                            </div>
                            <div className="mt-1 font-medium text-neutral-900">{listing.farmerEmail}</div>
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                              Bids
                            </div>
                            <div className="mt-1 font-medium text-neutral-900">
                              {latestBid
                                ? `Latest ${latestBid}`
                                : lowestBid
                                  ? `Starting ${lowestBid}`
                                  : "No bids yet"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-neutral-200 bg-[#f9f4ee] px-6 py-14 text-center">
                <div className="mx-auto max-w-md">
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">No matches</div>
                  <h2 className="mt-3 font-[family-name:var(--font-manrope)] text-2xl font-semibold text-neutral-900">
                    No marketplace items match your filters.
                  </h2>
                  <p className="mt-3 text-sm text-neutral-500">
                    Clear the search or broaden the status filter to see more active crop cases.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setStatusFilter("all");
                      setBidFilter("all");
                    }}
                    className="mt-6 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
