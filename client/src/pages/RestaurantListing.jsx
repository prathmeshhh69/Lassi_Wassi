import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiSearch } from "react-icons/fi";
import RestaurantCard from "../components/RestaurantCard.jsx";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "top", label: "Top Rated" },
  { key: "fast", label: "Fast Delivery" }
];

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm transition-colors duration-300">
      <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-900 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-900 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-slate-100 dark:bg-slate-900 animate-pulse" />
          <div className="h-6 w-20 rounded-full bg-slate-100 dark:bg-slate-900 animate-pulse" />
          <div className="h-6 w-14 rounded-full bg-slate-100 dark:bg-slate-900 animate-pulse" />
        </div>
        <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-900 animate-pulse" />
      </div>
    </div>
  );
}

function RestaurantListing({ restaurants = [], loading: loadingProp }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(
    typeof loadingProp === "boolean" ? loadingProp : true
  );

  useEffect(() => {
    if (typeof loadingProp === "boolean") {
      setLoading(loadingProp);
      return;
    }

    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, [loadingProp]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = restaurants;

    if (q) {
      result = result.filter((r) => r.name?.toLowerCase().includes(q));
    }

    if (filter === "top") {
      result = result.filter((r) => Number(r.rating || 0) >= 4.6);
    }

    if (filter === "fast") {
      result = result.filter((r) => Number(r.prepTime || 999) <= 25);
    }

    return result;
  }, [restaurants, query, filter]);

  return (
    <section className="pt-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-dark dark:text-light transition-colors duration-300">
            Explore Restaurants
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 transition-colors duration-300">
            Search and filter restaurants to find the perfect quick bite.
          </p>
        </div>

        {/* Search */}
        <div className="w-full sm:w-[360px]">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search restaurants..."
              className="w-full rounded-full bg-white dark:bg-slate-950 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors-transform ease-soft-out ring-1 ${
                active
                  ? "bg-primary text-white ring-primary/30 shadow-sm shadow-primary/15"
                  : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 ring-slate-200 dark:ring-slate-800 hover:ring-primary/30 hover:text-primary transition-colors duration-300"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <motion.div
        key={`${filter}-${query}-${loading}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
        className="mt-6"
      >
        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 p-10 text-center shadow-sm transition-colors duration-300">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FiSearch className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-dark dark:text-light transition-colors duration-300">
              No restaurants found
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 transition-colors duration-300">
              Try a different search or clear filters to explore more options.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setQuery("")}
                className="rounded-full bg-white dark:bg-slate-950 px-4 py-2 text-sm font-semibold text-dark dark:text-light ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-primary/30 hover:text-primary transition-colors-transform ease-soft-out"
              >
                Clear search
              </button>
              <button
                onClick={() => setFilter("all")}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/20 hover:bg-primary/90 transition-colors-transform ease-soft-out"
              >
                Show all
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <RestaurantCard
                key={r.id || r._id || r.name}
                name={r.name}
                image={r.image}
                rating={r.rating}
                prepTime={r.prepTime}
                cuisines={r.cuisines || []}
                href={`/restaurant/${r._id || r.id}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}

export default RestaurantListing;

