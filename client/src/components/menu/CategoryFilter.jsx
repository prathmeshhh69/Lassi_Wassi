import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

const CATEGORY_CONFIG = {
  All:           { icon: "🍽️", active: "bg-gray-900 text-white border-gray-900",           iconBg: "bg-gray-100" },
  Shawarma:      { icon: "🌯", active: "bg-amber-500 text-white border-amber-500",          iconBg: "bg-amber-50" },
  Lassi:         { icon: "🥛", active: "bg-yellow-400 text-yellow-900 border-yellow-400",   iconBg: "bg-yellow-50" },
  Juice:         { icon: "🍊", active: "bg-orange-400 text-white border-orange-400",        iconBg: "bg-orange-50" },
  Coffee:        { icon: "☕", active: "bg-amber-800 text-white border-amber-800",          iconBg: "bg-amber-50" },
  Mojito:        { icon: "🍃", active: "bg-emerald-500 text-white border-emerald-500",      iconBg: "bg-emerald-50" },
  "Ice Cream":   { icon: "🍨", active: "bg-pink-500 text-white border-pink-500",            iconBg: "bg-pink-50" },
  "Ice Tea":     { icon: "🧊", active: "bg-sky-500 text-white border-sky-500",              iconBg: "bg-sky-50" },
  "Thick Shake": { icon: "🥤", active: "bg-purple-500 text-white border-purple-500",        iconBg: "bg-purple-50" },
  Lemonades:     { icon: "🍋", active: "bg-lime-500 text-white border-lime-500",            iconBg: "bg-lime-50" },
};

const DEFAULT_CONFIG = { icon: "🍴", active: "bg-orange-500 text-white border-orange-500", iconBg: "bg-orange-50" };

/**
 * CategoryFilter
 *
 * Props:
 *   categories  – string[]
 *   active      – currently selected category string
 *   onChange    – (category: string) => void
 *   className   – optional extra classes on the scroll container
 */
export default function CategoryFilter({ categories, active, onChange, className = "" }) {
  const containerRef = useRef(null);

  /* Auto-scroll the active chip into view when it changes */
  useEffect(() => {
    if (!containerRef.current) return;
    const btn = containerRef.current.querySelector("[data-active='true']");
    btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  return (
    <div
      ref={containerRef}
      className={`flex gap-2 overflow-x-auto pb-1 scrollbar-none ${className}`}
    >
      {categories.map((cat) => {
        const isActive = cat === active;
        const cfg = CATEGORY_CONFIG[cat] ?? DEFAULT_CONFIG;

        return (
          <motion.button
            key={cat}
            data-active={isActive}
            onClick={() => onChange(cat)}
            whileTap={{ scale: 0.93 }}
            className={`relative flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
              isActive
                ? `${cfg.active} shadow-sm`
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {/* Icon circle */}
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm transition-colors ${
                isActive ? "bg-white/20" : cfg.iconBg
              }`}
              role="img"
              aria-hidden
            >
              {cfg.icon}
            </span>
            <span className="leading-none">{cat}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
