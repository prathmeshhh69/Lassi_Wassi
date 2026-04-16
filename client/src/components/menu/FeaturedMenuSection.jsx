import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import MenuCard from "./MenuCard.jsx";
import { featuredItems } from "../../data/menuData.js";

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

/**
 * FeaturedMenuSection
 *
 * Landing-page section: 5–6 bestseller cards + prominent "View Full Menu" CTA.
 * Intentionally limited — drives traffic to the dedicated /menu page.
 */
export default function FeaturedMenuSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* ── Header row ── */}
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-1">
            Handpicked for you
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
            Our Bestsellers
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            The crowd's all-time favourites — order in seconds.
          </p>
        </div>

        {/* Desktop — inline link */}
        <Link
          to="/menu"
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors flex-shrink-0"
        >
          View full menu
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* ── Cards grid ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {featuredItems.map((item, i) => (
          <FeaturedMenuCard key={item.id} item={item} index={i} />
        ))}
      </motion.div>

      {/* ── CTA button ── */}
      <div className="mt-8 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
        >
          <Link
            to="/menu"
            className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl shadow-md hover:shadow-orange-200 hover:shadow-lg transition-all duration-200 text-sm"
          >
            View Full Menu
            <motion.span
              className="inline-block"
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FeaturedMenuCard — extends MenuCard look with a badge ribbon.
   Kept local so landing page cards can diverge without touching MenuCard.
───────────────────────────────────────────────────────────────────────────── */

const CATEGORY_GRADIENTS = {
  Shawarma:     "from-amber-400 to-orange-500",
  Lassi:        "from-yellow-300 to-amber-400",
  Juice:        "from-orange-300 to-red-400",
  Coffee:       "from-amber-700 to-yellow-800",
  Mojito:       "from-emerald-400 to-teal-500",
  "Ice Cream":  "from-pink-300 to-rose-400",
  "Ice Tea":    "from-sky-300 to-blue-400",
  "Thick Shake":"from-purple-400 to-fuchsia-500",
  Lemonades:    "from-lime-300 to-yellow-400",
  default:      "from-orange-400 to-amber-500",
};

const CATEGORY_EMOJIS = {
  Shawarma:     "🌯",
  Lassi:        "🥛",
  Juice:        "🍊",
  Coffee:       "☕",
  Mojito:       "🍃",
  "Ice Cream":  "🍨",
  "Ice Tea":    "🧊",
  "Thick Shake":"🥤",
  Lemonades:    "🍋",
  default:      "🍴",
};

const BADGE_COLORS = {
  "Bestseller":     "bg-orange-500 text-white",
  "Fan Favourite":  "bg-yellow-400 text-yellow-900",
  "Must Try":       "bg-blue-500 text-white",
  "Popular":        "bg-teal-500 text-white",
  "Chef's Pick":    "bg-purple-500 text-white",
  "Trending":       "bg-rose-500 text-white",
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

const VEG_DOT   = <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />;
const NVEG_DOT  = <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />;

function FeaturedMenuCard({ item }) {
  const gradient  = CATEGORY_GRADIENTS[item.category] ?? CATEGORY_GRADIENTS.default;
  const emoji     = CATEGORY_EMOJIS[item.category]    ?? CATEGORY_EMOJIS.default;
  const badgeCls  = item.badge ? (BADGE_COLORS[item.badge] ?? "bg-gray-700 text-white") : null;
  const [imgError, setImgError] = useState(false);

  return (
    <motion.article
      variants={cardVariants}
      whileHover={{ y: -5, boxShadow: "0 20px 50px rgba(0,0,0,0.10)" }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
    >
      {/* Thumbnail */}
      <div className={`relative h-40 flex items-center justify-center bg-gradient-to-br ${gradient} overflow-hidden`}>
        {item.image && !imgError ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <span
            className="text-6xl select-none group-hover:scale-110 transition-transform duration-300"
            role="img"
            aria-label={item.category}
          >
            {emoji}
          </span>
        )}

        {/* Badge ribbon */}
        {item.badge && (
          <span className={`absolute top-0 left-0 text-[10px] font-bold px-2.5 py-1 rounded-br-xl ${badgeCls}`}>
            {item.badge}
          </span>
        )}

        {/* Prep time */}
        <span className="absolute bottom-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
          ⏱ {item.prepTime} min
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Veg indicator + name */}
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0">
            {item.type === "veg" ? VEG_DOT : NVEG_DOT}
          </span>
          <h3 className="text-sm font-bold text-gray-800 leading-snug">{item.name}</h3>
        </div>

        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Price */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-base font-extrabold text-gray-900">₹{item.price}</span>
          <Link
            to="/menu"
            className="px-3 py-1.5 bg-orange-50 hover:bg-orange-500 border border-orange-200 hover:border-orange-500 text-orange-500 hover:text-white text-xs font-bold rounded-lg transition-all duration-150"
          >
            Order →
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
