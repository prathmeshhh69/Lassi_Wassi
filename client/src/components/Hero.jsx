import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 }
};

const PHRASES = [
  { static: "Skip the Queue.", highlight: "Pre-Order Smart." },
  { static: "Fresh Every Time.", highlight: "Order in Seconds." },
  { static: "Your Craving,", highlight: "Delivered Fast." },
];

const phraseContainer = {
  enter: { transition: { staggerChildren: 0.08 } },
  center: { transition: { staggerChildren: 0.08 } },
  exit: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
};

const phraseLine = {
  enter:  { opacity: 0, y: 10, filter: "blur(3px)" },
  center: { opacity: 1, y: 0,  filter: "blur(0px)",
    transition: { duration: 0.52, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:   { opacity: 0, y: -8, filter: "blur(3px)",
    transition: { duration: 0.22, ease: [0.55, 0.06, 0.68, 0.19] } },
};

function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % PHRASES.length), 3600);
    return () => clearInterval(id);
  }, []);

  const phrase = PHRASES[index];
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-accent/10 to-light dark:from-primary/10 dark:via-accent/5 dark:to-slate-950 transition-colors duration-300" />

      <div className="py-10 sm:py-12 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left */}
          <motion.div
            initial="hidden"
            animate="show"
            transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
            className="space-y-6"
          >
            <motion.p
              variants={fadeUp}
              transition={{ delay: 0.05 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 ring-1 ring-slate-200/60 dark:ring-slate-800/70 transition-colors duration-300"
            >
              <span className="h-2 w-2 rounded-full bg-primary" />
              Live tracking • Smart pre-orders
            </motion.p>

            <motion.h1
              variants={fadeUp}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-dark dark:text-light transition-colors duration-300 min-h-[2.6em] sm:min-h-[2.4em] lg:min-h-[2.2em]"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  variants={phraseContainer}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <motion.span variants={phraseLine} className="block">
                    {phrase.static}
                  </motion.span>
                  <motion.span variants={phraseLine} className="block text-primary">
                    {phrase.highlight}
                  </motion.span>
                </motion.div>
              </AnimatePresence>
            </motion.h1>

            {/* Phrase progress dots */}
            <motion.div
              variants={fadeUp}
              transition={{ delay: 0.12 }}
              className="flex items-center gap-1.5"
            >
              {PHRASES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Phrase ${i + 1}`}
                  className={`rounded-full transition-all duration-300 ${
                    i === index
                      ? "w-5 h-1.5 bg-primary"
                      : "w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-primary/50"
                  }`}
                />
              ))}
            </motion.div>

            <motion.p
              variants={fadeUp}
              transition={{ delay: 0.15 }}
              className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl transition-colors duration-300"
            >
              Track every step of your order in real time and schedule pickups or
              deliveries ahead of time—so your food is ready exactly when you
              are.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link to="/menu">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90 transition-colors-transform ease-soft-out"
                >
                  Order Now
                </motion.button>
              </Link>
              <Link to="/menu">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center rounded-full bg-white dark:bg-slate-950 px-6 py-3 text-sm font-semibold text-dark dark:text-light ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-primary/40 hover:text-primary transition-colors-transform ease-soft-out"
                >
                  Pre-Order
                </motion.button>
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ delay: 0.25 }}
              className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300"
            >
              <p>
                <span className="font-semibold text-dark dark:text-light transition-colors duration-300">
                  ETA
                </span>{" "}
                updates as
                kitchens get busy
              </p>
              <p>
                <span className="font-semibold text-dark dark:text-light transition-colors duration-300">
                  Pre-order
                </span>{" "}
                for
                peak hours
              </p>
            </motion.div>
          </motion.div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative"
          >
            <div className="relative mx-auto aspect-[4/3] w-full max-w-xl rounded-3xl bg-white/70 dark:bg-slate-900/50 p-3 ring-1 ring-slate-200/70 dark:ring-slate-800/70 shadow-xl shadow-primary/10 transition-colors duration-300">
              <div className="h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-slate-100 dark:to-slate-900 transition-colors duration-300 relative">
                {/* Hero food photo */}
                <img
                  src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop&auto=format&q=85"
                  alt="Delicious Lassi Wassi food spread"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                />
                {/* Dark overlay for card readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Floating live order card */}
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
                  className="absolute bottom-5 left-5 right-5 sm:right-auto sm:w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl ring-1 ring-slate-200 dark:ring-slate-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Live Order</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      On the way
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-2">
                    <motion.div
                      className="h-1.5 rounded-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: "72%" }}
                      transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm">
                        🌯
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Chicken Shawarma</p>
                        <p className="text-[10px] text-slate-500">Arriving in 8 min</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary">₹100</span>
                  </div>
                </motion.div>

                {/* Top-right rating badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="absolute top-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg ring-1 ring-slate-200 dark:ring-slate-700 flex items-center gap-1.5"
                >
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">4.9</span>
                  <span className="text-[10px] text-slate-500">· 2.4k orders</span>
                </motion.div>
              </div>
            </div>

            <div className="pointer-events-none absolute -bottom-6 -left-6 h-40 w-40 rounded-full bg-primary/15 blur-2xl" />
            <div className="pointer-events-none absolute -top-10 -right-10 h-56 w-56 rounded-full bg-accent/25 blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;

