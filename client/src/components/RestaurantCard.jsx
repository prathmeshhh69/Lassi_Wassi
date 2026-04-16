import { FiClock, FiStar } from "react-icons/fi";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function RestaurantCard({
  name,
  image,
  rating = 4.5,
  prepTime = 25,
  cuisines = [],
  onClick,
  href
}) {
  const Wrapper = href ? Link : "div";

  return (
    <Wrapper
      {...(href ? { to: href } : {})}
      onClick={onClick}
      className="group block cursor-pointer"
    >
      <motion.article
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
        className="overflow-hidden rounded-2xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm transition-shadow duration-200 hover:shadow-xl hover:shadow-slate-200/70 dark:hover:shadow-black/20"
      >
        <div className="relative aspect-[4/3] w-full">
          <img
            src={
              image ||
              "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=70"
            }
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 ease-soft-out group-hover:scale-105"
            loading="lazy"
          />

          {/* Bottom gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/0 to-transparent" />

          {/* Rating badge */}
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              <FiStar className="h-3.5 w-3.5" />
              {Number(rating).toFixed(1)}
            </span>
          </div>

          {/* Name + prep time on image */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="flex items-end justify-between gap-3">
              <h3 className="text-base sm:text-lg font-semibold text-white leading-snug">
                {name}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/20">
                <FiClock className="h-3.5 w-3.5" />
                {prepTime} min
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {cuisines.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-800 transition-colors duration-300"
              >
                {tag}
              </span>
            ))}
            {cuisines.length > 4 && (
              <span className="rounded-full bg-slate-50 dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-800 transition-colors duration-300">
                +{cuisines.length - 4}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <p className="truncate">
              Tap to view menu &amp; live tracking
            </p>
            <span className="font-medium text-primary">View</span>
          </div>
        </div>
      </motion.article>
    </Wrapper>
  );
}

export default RestaurantCard;

