import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../components/Layout.jsx";
import CategoryFilter from "../components/menu/CategoryFilter.jsx";
import MenuCard from "../components/menu/MenuCard.jsx";
import { menuItems as staticMenuItems, MENU_CATEGORIES } from "../data/menuData.js";
import api from "../services/api.js";

/* ── Animation presets ───────────────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ── Full Menu Page ──────────────────────────────────────────────────────── */
/** Normalise a DB menu item to the shape MenuCard expects */
const normaliseItem = (m) => ({
  id:          m._id,
  name:        m.name,
  price:       m.price,
  category:    m.category ?? "Other",
  type:        m.type ?? "veg",
  description: m.description ?? "",
  prepTime:    m.preparationTime ?? 15,
  image:       m.image ?? null,
  restaurantId: m.restaurant,
});

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch]                 = useState("");
  const [menuItems, setMenuItems]           = useState([]);
  const [restaurantId, setRestaurantId]     = useState(null);
  const [menuLoading, setMenuLoading]       = useState(true);
  const filterRef                           = useRef(null);

  /* Fetch restaurant then its real menu items from the API.
     Falls back to static menuData.js only when the server is unreachable. */
  useEffect(() => {
    let rid = null;
    api.get("/api/restaurants")
      .then(({ data }) => {
        const list = data.data ?? [];
        if (list.length === 0) throw new Error("no-restaurants");
        rid = list[0]._id;
        setRestaurantId(rid);
        return api.get(`/api/restaurants/${rid}/menu`);
      })
      .then((res) => {
        const items = res.data.data;
        // Guard: must be a non-empty array of documents with _id
        if (Array.isArray(items) && items.length > 0 && items[0]._id) {
          setMenuItems(items.map(normaliseItem));
        } else {
          // DB seeded but returned unexpected shape — fall back with real restaurantId
          setMenuItems(staticMenuItems.map((m) => ({ ...m, restaurantId: rid })));
        }
      })
      .catch((err) => {
        if (err.message === "no-restaurants") {
          setMenuItems(staticMenuItems);
        } else {
          // API unreachable or 5xx — show static items but block ordering
          setMenuItems(staticMenuItems);
        }
      })
      .finally(() => setMenuLoading(false));
  }, []);

  /* Sticky filter bar shadow once scrolled */
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const handleScroll = () => setPinned(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Filtered + searched items */
  const filtered = useMemo(() => {
    let items = activeCategory === "All"
      ? menuItems
      : menuItems.filter((i) => i.category === activeCategory);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [activeCategory, search, menuItems]);

  /* Group by category for "All" view; flat list otherwise */
  const showGrouped = activeCategory === "All" && !search.trim();

  const groupMap = useMemo(() => {
    if (!showGrouped) return null;
    return filtered.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [filtered, showGrouped]);

  const categoryGroups = showGrouped
    ? MENU_CATEGORIES.filter((c) => c !== "All" && groupMap[c]?.length)
    : null;

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setSearch("");
    window.scrollTo({ top: (filterRef.current?.offsetTop ?? 0) - 20, behavior: "smooth" });
  };

  return (
    <Layout pageKey="menu">
      {/* ── Hero banner ── */}
      <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-white border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">
              Lassi Wassi Menu
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              The Full Menu
            </h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-md">
              Fresh, made-to-order — explore every category, filter by taste, order instantly.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Sticky filter + search bar ── */}
      <div
        ref={filterRef}
        className={`sticky top-[64px] z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-shadow duration-200 ${
          pinned ? "shadow-md" : ""
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Category chips */}
          <div className="flex-1 min-w-0">
            <CategoryFilter
              categories={MENU_CATEGORIES}
              active={activeCategory}
              onChange={handleCategoryChange}
            />
          </div>

          {/* Search */}
          <div className="relative sm:w-52 w-full flex-shrink-0">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Results summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-gray-400">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
            {search ? ` for "${search}"` : activeCategory !== "All" ? ` in ${activeCategory}` : " across all categories"}
          </p>
          {(search || activeCategory !== "All") && (
            <button
              onClick={() => { setSearch(""); setActiveCategory("All"); }}
              className="text-xs text-orange-500 hover:text-orange-600 font-semibold transition-colors"
            >
              Clear filters ✕
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {menuLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 py-4"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </motion.div>
          ) : filtered.length === 0 ? (
            /* ── Empty state ── */
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center"
            >
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-500 font-semibold">No items match your search.</p>
              <p className="text-gray-400 text-sm mt-1">Try a different keyword or category.</p>
              <button
                onClick={() => { setSearch(""); setActiveCategory("All"); }}
                className="mt-5 px-5 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition"
              >
                Show all items
              </button>
            </motion.div>

          ) : showGrouped ? (
            /* ── Grouped (All, no search) ── */
            <motion.div
              key="grouped"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {categoryGroups.map((cat) => (
                <motion.section
                  key={cat}
                  variants={sectionVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.05 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-extrabold text-gray-800">{cat}</h2>
                    <span className="text-xs text-gray-400 font-medium">
                      {groupMap[cat].length} items
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                    <button
                      onClick={() => handleCategoryChange(cat)}
                      className="text-xs text-orange-500 hover:text-orange-600 font-semibold transition-colors flex-shrink-0"
                    >
                      See all →
                    </button>
                  </div>

                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.05 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                  >
                    {groupMap[cat].map((item, i) => (
                      <MenuCard key={item.id} item={item} index={i} restaurantId={restaurantId} />
                    ))}
                  </motion.div>
                </motion.section>
              ))}
            </motion.div>

          ) : (
            /* ── Flat filtered view ── */
            <motion.div
              key={`${activeCategory}-${search}`}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {filtered.map((item, i) => (
                <MenuCard key={item.id} item={item} index={i} restaurantId={restaurantId} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
