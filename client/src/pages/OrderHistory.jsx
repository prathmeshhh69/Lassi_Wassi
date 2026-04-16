import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiClock, FiPackage, FiChevronDown, FiChevronUp,
  FiXCircle, FiAlertCircle, FiRefreshCw,
} from "react-icons/fi";
import { MdOutlineDeliveryDining } from "react-icons/md";
import { getMyOrders, cancelOrder } from "../services/orderApi";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  pending:          { label: "Pending",          color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",   icon: FiClock },
  preparing:        { label: "Preparing",        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",       icon: FiPackage },
  out_for_delivery: { label: "On the way",       color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", icon: MdOutlineDeliveryDining },
  completed:        { label: "Delivered",        color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: FiPackage },
  cancelled:        { label: "Cancelled",        color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",           icon: FiXCircle },
};

// ─── Progress stepper ─────────────────────────────────────────────────────────
const STEPS = ["pending", "preparing", "out_for_delivery", "completed"];

function StatusStepper({ status }) {
  if (status === "cancelled") return null;
  const currentIdx = STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-3">
      {STEPS.map((step, i) => {
        const done    = i <= currentIdx;
        const active  = i === currentIdx;
        const cfg     = STATUS[step];
        return (
          <div key={step} className="flex items-center gap-1 flex-1">
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs transition-all duration-300 ${done ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"} ${active ? "ring-2 ring-primary/30" : ""}`}>
              {i + 1}
            </div>
            <span className={`text-[10px] font-medium transition-colors hidden sm:block ${done ? "text-primary" : "text-slate-400 dark:text-slate-500"}`}>
              {cfg.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${i < currentIdx ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Single order card ────────────────────────────────────────────────────────
function OrderCard({ order, onCancelled }) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const cfg = STATUS[order.status] || STATUS.pending;
  const Icon = cfg.icon;

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError("");
    try {
      await cancelOrder(order._id);
      onCancelled(order._id);
    } catch (err) {
      setCancelError(err?.response?.data?.message || "Could not cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  const placedAt = new Date(order.createdAt).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const etaStr = order.estimatedDeliveryTime
    ? new Date(order.estimatedDeliveryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm overflow-hidden"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.color}`}>
              <Icon size={11} />
              {cfg.label}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              #{order._id.slice(-8).toUpperCase()}
            </span>
          </div>

          <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
            {order.restaurant?.name ?? "Restaurant"}
          </p>

          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{placedAt}</p>

          {etaStr && order.status !== "completed" && order.status !== "cancelled" && (
            <p className="mt-1 text-xs text-primary font-medium">
              <FiClock size={10} className="inline mr-1" />
              ETA: {etaStr}
            </p>
          )}

          <StatusStepper status={order.status} />
        </div>

        <div className="shrink-0 text-right">
          <p className="text-base font-bold text-slate-900 dark:text-slate-50 tabular-nums">
            ₹{order.totalAmount.toFixed(0)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
          >
            {expanded ? "Hide" : "Details"} {expanded ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Expandable details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 dark:border-slate-800 px-4 sm:px-5 py-4 space-y-3">
              {/* Items */}
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-200">
                      {item.menuItem?.name ?? "Item"}{" "}
                      <span className="text-slate-400">× {item.quantity}</span>
                    </span>
                    <span className="text-slate-700 dark:text-slate-200 tabular-nums font-medium">
                      ₹{(item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Address */}
              {order.deliveryAddress?.street && (
                <p className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                  📍 {[order.deliveryAddress.street, order.deliveryAddress.city, order.deliveryAddress.pincode].filter(Boolean).join(", ")}
                </p>
              )}

              {/* Cancel */}
              {order.status === "pending" && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  {cancelError && (
                    <p className="mb-2 text-xs text-red-600 flex items-center gap-1">
                      <FiAlertCircle size={11} /> {cancelError}
                    </p>
                  )}
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                  >
                    <FiXCircle size={13} />
                    {cancelling ? "Cancelling…" : "Cancel order"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────
const FILTERS = [
  { key: "",                label: "All"       },
  { key: "pending",         label: "Pending"   },
  { key: "preparing",       label: "Preparing" },
  { key: "out_for_delivery",label: "On the way"},
  { key: "completed",       label: "Delivered" },
  { key: "cancelled",       label: "Cancelled" },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OrderHistory() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [filter, setFilter]   = useState("");
  const [page, setPage]       = useState(1);
  const [meta, setMeta]       = useState({ total: 0, pages: 1 });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 10 };
      if (filter) params.status = filter;
      const { data } = await getMyOrders(params);
      setOrders(data.data);
      setMeta(data.meta);
    } catch {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [filter]);

  const handleCancelled = (id) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === id ? { ...o, status: "cancelled" } : o))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="container max-w-3xl mx-auto px-4 pt-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">My Orders</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {meta.total} order{meta.total !== 1 ? "s" : ""} total
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-slate-200 dark:ring-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FiRefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                filter === key
                  ? "bg-primary text-white shadow-sm shadow-primary/20"
                  : "ring-1 ring-slate-200 dark:ring-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200 dark:ring-red-800 px-5 py-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <FiAlertCircle size={15} /> {error}
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-3xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 p-12 text-center shadow-sm"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <FiPackage size={26} className="text-primary" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">No orders yet</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Place your first order to see it here.</p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors"
            >
              Browse restaurants
            </Link>
          </motion.div>
        ) : (
          <>
            <AnimatePresence>
              <div className="space-y-4">
                {orders.map((order) => (
                  <OrderCard key={order._id} order={order} onCancelled={handleCancelled} />
                ))}
              </div>
            </AnimatePresence>

            {/* Pagination */}
            {meta.pages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-full px-4 py-1.5 text-xs font-semibold ring-1 ring-slate-200 dark:ring-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500 tabular-nums">
                  {page} / {meta.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                  disabled={page === meta.pages}
                  className="rounded-full px-4 py-1.5 text-xs font-semibold ring-1 ring-slate-200 dark:ring-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
