import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiClock, FiMapPin, FiPackage, FiShoppingBag, FiTruck } from "react-icons/fi";

const STEPS = [
  { key: "placed", label: "Placed", icon: FiShoppingBag },
  { key: "preparing", label: "Preparing", icon: FiPackage },
  { key: "ready", label: "Ready", icon: FiClock },
  { key: "delivered", label: "Delivered", icon: FiTruck }
];

const ease = [0.22, 0.61, 0.36, 1];

const cardReveal = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

function formatMmSs(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function StatusBadge({ status }) {
  const meta = {
    placed: { label: "Placed", cls: "bg-slate-900 text-white" },
    preparing: { label: "Preparing", cls: "bg-amber-500 text-white" },
    ready: { label: "Ready", cls: "bg-emerald-600 text-white" },
    delivered: { label: "Delivered", cls: "bg-slate-900 text-white" },
    cancelled: { label: "Cancelled", cls: "bg-red-600 text-white" }
  }[status] || { label: "Unknown", cls: "bg-slate-700 text-white" };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${meta.cls}`}>
      Live: {meta.label}
    </span>
  );
}

function StepProgress({ status }) {
  const activeIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.key === status)
  );
  const clampedIndex = activeIndex === -1 ? 0 : activeIndex;
  const progressPct =
    STEPS.length <= 1 ? 0 : (clampedIndex / (STEPS.length - 1)) * 100;

  return (
    <div className="relative">
      {/* Track */}
      <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-slate-200 dark:bg-slate-800 transition-colors duration-300" />
      {/* Fill */}
      <motion.div
        className="absolute left-0 top-5 h-1 rounded-full bg-primary"
        initial={{ width: "0%" }}
        animate={{ width: `${progressPct}%` }}
        transition={{ duration: 0.45, ease }}
      />

      <div className="relative grid grid-cols-4 gap-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < clampedIndex;
          const isActive = idx === clampedIndex;

          return (
            <div key={step.key} className="flex flex-col items-center text-center">
              <motion.div
                initial={false}
                animate={
                  isActive
                    ? {
                        scale: 1.06,
                        boxShadow: "0 12px 30px rgba(255, 107, 53, 0.25)"
                      }
                    : { scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" }
                }
                transition={{ duration: 0.25, ease }}
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${
                  isDone
                    ? "bg-primary text-white ring-primary/30"
                    : isActive
                      ? "bg-white dark:bg-slate-950 text-primary ring-primary/30"
                      : "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 ring-slate-200 dark:ring-slate-800"
                }`}
              >
                <Icon className="h-5 w-5" />
                {isActive ? (
                  <motion.span
                    aria-hidden="true"
                    className="absolute -inset-1 rounded-2xl border border-primary/30"
                    animate={{ opacity: [0.35, 0.75, 0.35] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                ) : null}
              </motion.div>

              <p
                className={`mt-2 text-xs font-semibold transition-colors duration-300 ${
                  isActive
                    ? "text-dark dark:text-light"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderTracking({ order }) {
  const demoOrder = useMemo(() => {
    const etaSeconds = 18 * 60 + 30; // 18:30
    return {
      id: "LW-1042",
      status: "preparing",
      restaurantName: "Punjab Lassi House",
      deliveryAddress: "Near City Center, Pune",
      placedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      etaTarget: new Date(Date.now() + etaSeconds * 1000).toISOString(),
      items: [
        { name: "Classic Sweet Lassi", qty: 2, price: 99 },
        { name: "Tandoori Paneer Roll", qty: 1, price: 199 }
      ]
    };
  }, []);

  const data = order || demoOrder;

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const etaSeconds = useMemo(() => {
    const target = new Date(data.etaTarget).getTime();
    return Math.max(0, Math.floor((target - now) / 1000));
  }, [data.etaTarget, now]);

  const subtotal = useMemo(
    () => data.items.reduce((s, it) => s + it.qty * it.price, 0),
    [data.items]
  );

  return (
    <section className="pt-10">
      <motion.div
        variants={cardReveal}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.45, ease }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-dark dark:text-light transition-colors duration-300">
            Order Tracking
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 transition-colors duration-300">
            Real-time updates for order{" "}
            <span className="font-semibold text-dark dark:text-light transition-colors duration-300">
              {data.id}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={data.status} />
          <span className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-800 transition-colors duration-300">
            <FiClock className="h-4 w-4 text-slate-500 dark:text-slate-300 transition-colors duration-300" />
            ETA {formatMmSs(etaSeconds)}
          </span>
        </div>
      </motion.div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr,minmax(0,1fr)] items-start">
        {/* Left: progress + map */}
        <div className="space-y-6">
          <motion.div
            variants={cardReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, ease }}
            className="rounded-3xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 p-6 shadow-sm transition-colors duration-300"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-dark dark:text-light transition-colors duration-300">
                  Progress
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 transition-colors duration-300">
                  We’ll keep updating as your order moves through the kitchen.
                </p>
              </div>
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={data.status}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease }}
                  className="hidden sm:block text-right"
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300">
                    Current
                  </p>
                  <p className="text-sm font-semibold text-dark dark:text-light capitalize transition-colors duration-300">
                    {data.status}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-6">
              <StepProgress status={data.status} />
            </div>
          </motion.div>

          <motion.div
            variants={cardReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, ease }}
            className="rounded-3xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden shadow-sm transition-colors duration-300"
          >
            <div className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-dark dark:text-light transition-colors duration-300">
                    Map
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 transition-colors duration-300">
                    Live driver location will appear here.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-800 transition-colors duration-300">
                  <FiMapPin className="h-4 w-4 text-primary" />
                  {data.deliveryAddress}
                </span>
              </div>
            </div>

            <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 via-accent/10 to-slate-100 dark:to-slate-900 transition-colors duration-300">
              <div className="flex h-full items-center justify-center">
                <div className="text-center px-8">
                  <p className="text-sm font-semibold text-dark dark:text-light transition-colors duration-300">
                    Map placeholder
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 transition-colors duration-300">
                    Integrate Google Maps / Mapbox later.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: summary */}
        <motion.aside
          variants={cardReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, ease }}
          className="lg:sticky lg:top-24 rounded-3xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 p-6 shadow-sm transition-colors duration-300"
        >
          <h2 className="text-base font-semibold text-dark dark:text-light transition-colors duration-300">
            Order summary
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 transition-colors duration-300">
            {data.restaurantName}
          </p>

          <div className="mt-5 space-y-3">
            {data.items.map((it) => (
              <div key={it.name} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-dark dark:text-light transition-colors duration-300">
                    {it.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300">
                    Qty {it.qty} • ₹{it.price}
                  </p>
                </div>
                <p className="text-sm font-semibold text-dark dark:text-light tabular-nums transition-colors duration-300">
                  ₹{it.qty * it.price}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2 text-sm transition-colors duration-300">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-300 transition-colors duration-300">
                Subtotal
              </span>
              <span className="font-semibold text-dark dark:text-light tabular-nums transition-colors duration-300">
                ₹{subtotal}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-300 transition-colors duration-300">
                Delivery
              </span>
              <span className="font-semibold text-dark dark:text-light tabular-nums transition-colors duration-300">
                ₹0
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-3 transition-colors duration-300">
              <span className="font-semibold text-slate-700 dark:text-slate-200 transition-colors duration-300">
                Total
              </span>
              <span className="font-semibold text-dark dark:text-light text-lg tabular-nums transition-colors duration-300">
                ₹{subtotal}
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="mt-5 w-full inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90 transition-colors-transform ease-soft-out"
          >
            Contact support
          </motion.button>

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300">
            Need help? We’ll assist you with order updates and refunds.
          </p>
        </motion.aside>
      </div>
    </section>
  );
}

export default OrderTracking;

