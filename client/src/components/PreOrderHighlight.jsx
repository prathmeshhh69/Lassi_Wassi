import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiCalendar, FiClock, FiMapPin } from "react-icons/fi";

const container = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 0.61, 0.36, 1], staggerChildren: 0.06 }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 0.61, 0.36, 1] } }
};

function Feature({ icon: Icon, title, description }) {
  return (
    <motion.div variants={item} className="flex gap-3">
      <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-slate-950 shadow-sm ring-1 ring-primary/15 dark:ring-primary/25 transition-colors duration-300">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-dark dark:text-light transition-colors duration-300">
          {title}
        </p>
        {description ? (
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300 transition-colors duration-300">
            {description}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}

function PreOrderHighlight() {
  return (
    <section className="pt-10">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-accent/10 to-white dark:to-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm transition-colors duration-300"
      >
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-accent/20 blur-2xl" />

        <div className="relative grid gap-10 p-6 sm:p-8 lg:p-10 lg:grid-cols-2 items-center">
          {/* Left — visual */}
          <motion.div variants={item} className="order-2 lg:order-1">
            <div className="mx-auto w-full max-w-lg">
              <div className="aspect-[4/3] rounded-3xl bg-white/70 dark:bg-slate-900/50 p-3 ring-1 ring-slate-200/70 dark:ring-slate-800/70 shadow-xl shadow-primary/10 transition-colors duration-300 overflow-hidden relative">
                {/* Background food photo */}
                <div className="absolute inset-3 rounded-2xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=640&h=480&fit=crop&auto=format&q=85"
                    alt="Pre-order food"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>

                {/* Floating schedule card */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.45 }}
                  className="absolute top-7 left-7 bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-lg ring-1 ring-slate-200 dark:ring-slate-700 w-44"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Your Slot</p>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-primary text-sm">📅</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Today, 7:30 PM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary text-sm">📍</span>
                    <span className="text-xs text-slate-500">Table 4 — Dine in</span>
                  </div>
                  <div className="mt-2 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: "85%" }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.7, duration: 1.0, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Confirmed • Kitchen notified</p>
                </motion.div>

                {/* Bottom items ordered card */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.45 }}
                  className="absolute bottom-7 left-7 right-7 bg-white dark:bg-slate-900 rounded-2xl px-4 py-3 shadow-lg ring-1 ring-slate-200 dark:ring-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {["🌯", "🥛", "☕"].map((emoji, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 border-2 border-white flex items-center justify-center text-sm">
                          {emoji}
                        </div>
                      ))}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">3 items</p>
                      <p className="text-[10px] text-primary font-semibold">₹230 total</p>
                    </div>
                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">Pre-ordered ✓</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Right content */}
          <div className="order-1 lg:order-2">
            <motion.h2
              variants={item}
              className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-dark dark:text-light transition-colors duration-300"
            >
              Pre-Order &amp; Walk In Like a VIP
            </motion.h2>

            <motion.p
              variants={item}
              className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl transition-colors duration-300"
            >
              Lock your slot, skip the crowd, and get transparent ETAs—whether you’re picking up or getting it delivered.
            </motion.p>

            <div className="mt-6 grid gap-4">
              <Feature
                icon={FiClock}
                title="No waiting"
                description="Your order starts before you arrive—ready when you are."
              />
              <Feature
                icon={FiCalendar}
                title="Smart time scheduling"
                description="Choose a time window that fits your day with confidence."
              />
              <Feature
                icon={FiMapPin}
                title="Live order tracking"
                description="Track preparation and delivery progress in real time."
              />
            </div>

            <motion.div variants={item} className="mt-7 flex flex-wrap gap-3">
              <Link to="/menu">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90 transition-colors-transform ease-soft-out"
                >
                  Pre-Order
                </motion.button>
              </Link>
              <Link to="/about">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center rounded-full bg-white dark:bg-slate-950 px-6 py-3 text-sm font-semibold text-dark dark:text-light ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-primary/40 hover:text-primary transition-colors-transform ease-soft-out"
                >
                  Learn more
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default PreOrderHighlight;

