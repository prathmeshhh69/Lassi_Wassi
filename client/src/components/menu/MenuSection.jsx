import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import MenuCard from "./MenuCard.jsx";
import CategoryFilter from "./CategoryFilter.jsx";
import SectionTitle from "../ui/SectionTitle.jsx";
import { menuItems, MENU_CATEGORIES, filterByCategory } from "../../data/menuData.js";

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.055 },
  },
};

/**
 * MenuSection
 *
 * Self-contained menu block: owns category state when used standalone,
 * or accepts controlled props for use inside a page that manages state.
 *
 * Controlled props (all optional — pass none for self-controlled mode):
 *   activeCategory  – controlled active category string
 *   onCategoryChange – (cat: string) => void
 *
 * Static-to-API migration:
 *   Replace `useMemo(filterByCategory, ...)` with an `useEffect` API call.
 *   The rest of the component stays unchanged.
 */
export default function MenuSection({ activeCategory, onCategoryChange }) {
  // Fallback: self-controlled (not used when Home.jsx passes props)
  const filtered = useMemo(() => filterByCategory(activeCategory), [activeCategory]);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* ── Section heading ── */}
      <SectionTitle
        title="Our Menu"
        subtitle="Fresh, fast and made to order"
        size="md"
        className="mb-5"
        action={
          <Link
            to="/menu"
            className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
          >
            View full menu →
          </Link>
        }
      />

      {/* ── Category chips ── */}
      <CategoryFilter
        categories={MENU_CATEGORIES}
        active={activeCategory ?? "All"}
        onChange={onCategoryChange ?? (() => {})}
        className="mb-6"
      />

      {/* ── Grid ── */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-16 text-center text-gray-400 text-sm"
          >
            No items found for this category.
          </motion.div>
        ) : (
          <motion.div
            key={activeCategory ?? "all"}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {filtered.map((item, i) => (
              <MenuCard key={item.id} item={item} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Item count ── */}
      {filtered.length > 0 && (
        <p className="mt-4 text-xs text-gray-400 text-right">
          Showing {filtered.length} of {menuItems.length} items
        </p>
      )}
    </section>
  );
}
