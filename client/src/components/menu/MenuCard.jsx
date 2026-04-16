import { memo, useState } from "react";
import { motion } from "framer-motion";
import { useCart } from "../../context/CartContext.jsx";

/**
 * Gradient fallbacks per category — used when item.image is null.
 */
const CATEGORY_GRADIENTS = {
  Shawarma:    "from-amber-400 to-orange-500",
  Lassi:       "from-yellow-300 to-amber-400",
  Juice:       "from-orange-300 to-red-400",
  Coffee:      "from-amber-800 to-yellow-900",
  Mojito:      "from-emerald-400 to-teal-500",
  "Ice Cream": "from-pink-300 to-rose-400",
  "Ice Tea":   "from-sky-300 to-blue-400",
  "Thick Shake":"from-purple-400 to-fuchsia-500",
  Lemonades:   "from-lime-300 to-yellow-400",
  default:     "from-orange-400 to-amber-500",
};

const CATEGORY_EMOJIS = {
  Shawarma:    "🌯",
  Lassi:       "🥛",
  Juice:       "🍊",
  Coffee:      "☕",
  Mojito:      "🍃",
  "Ice Cream": "🍨",
  "Ice Tea":   "🧊",
  "Thick Shake":"🥤",
  Lemonades:   "🍋",
  default:     "🍴",
};

const VEG_BADGE = (
  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
    Veg
  </span>
);

const NON_VEG_BADGE = (
  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
    Non‑Veg
  </span>
);

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1,
    transition: { type: "spring", stiffness: 280, damping: 26 } },
};

/**
 * MenuCard — renders a single menu item.
 *
 * Props:
 *   item     – full item object from menuData.js
 *   index    – stagger delay index
 *   onAdd    – optional override; called instead of CartContext when provided
 *              (useful for pages without CartProvider)
 */
const isObjectId = (id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

const MenuCard = memo(function MenuCard({ item, index = 0, onAdd, restaurantId }) {
  const cartCtx   = useCart?.();
  const addToCart = onAdd ?? cartCtx?.addItem;
  const [imgError, setImgError] = useState(false);

  const gradient  = CATEGORY_GRADIENTS[item.category] ?? CATEGORY_GRADIENTS.default;
  const emoji     = CATEGORY_EMOJIS[item.category]    ?? CATEGORY_EMOJIS.default;

  // Only allow ordering if both IDs are real MongoDB ObjectIds
  const canOrder = isObjectId(item.id) && isObjectId(restaurantId ?? item.restaurantId);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canOrder) return;
    addToCart?.({
      menuItemId:     item.id,
      name:           item.name,
      price:          item.price,
      image:          item.image,
      restaurantId:   restaurantId ?? item.restaurantId,
      restaurantName: "Lassi Wassi",
      prepTime:       item.prepTime ?? 10,
    });
  };

  return (
    <motion.article
      variants={cardVariants}
      whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.10)" }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col cursor-default"
    >
      {/* ── Thumbnail ── */}
      <div className={`relative h-36 flex items-center justify-center bg-gradient-to-br ${gradient} overflow-hidden`}>
        {item.image && !imgError ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <span
            className="text-5xl select-none group-hover:scale-110 transition-transform duration-300"
            role="img"
            aria-label={item.category}
          >
            {emoji}
          </span>
        )}

        {/* Prep-time pill */}
        <span className="absolute top-2.5 right-2.5 bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
          ⏱ {item.prepTime} min
        </span>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Name + veg badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-800 leading-snug line-clamp-2 flex-1">
            {item.name}
          </h3>
          {item.type === "veg" ? VEG_BADGE : NON_VEG_BADGE}
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-base font-extrabold text-gray-900">
            ₹{item.price}
          </span>
          <motion.button
            whileTap={canOrder ? { scale: 0.93 } : {}}
            onClick={handleAdd}
            disabled={!canOrder}
            title={canOrder ? undefined : "Menu is loading, please wait…"}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-sm ${
              canOrder
                ? "bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {canOrder ? "+ Add" : "Loading…"}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
});

export default MenuCard;
