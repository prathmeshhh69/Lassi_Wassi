import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMinus, FiPlus, FiTrash2, FiClock, FiMapPin,
  FiShoppingBag, FiCheck, FiAlertCircle, FiChevronRight,
} from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { placeOrder } from "../services/orderApi";

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Money({ value }) {
  return <span className="tabular-nums">₹{Number(value || 0).toFixed(0)}</span>;
}

// ─── Cart item row ────────────────────────────────────────────────────────────
function CartItemRow({ item }) {
  const { setQuantity, removeItem } = useCart();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
      className="group rounded-2xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex gap-4 p-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
          {item.image ? (
            <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-600">
              <FiShoppingBag size={24} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{item.name}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                <Money value={item.price} /> each
              </p>
            </div>
            <button
              onClick={() => removeItem(item.menuItemId)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-red-200 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <FiTrash2 size={12} />
              <span className="hidden sm:inline">Remove</span>
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 dark:bg-slate-900 px-2 py-1 ring-1 ring-slate-200 dark:ring-slate-800">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setQuantity(item.menuItemId, item.quantity - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <FiMinus size={13} />
              </motion.button>
              <span className="w-7 text-center text-sm font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
                {item.quantity}
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setQuantity(item.menuItemId, item.quantity + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <FiPlus size={13} />
              </motion.button>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
              <Money value={item.price * item.quantity} />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty cart ───────────────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 p-12 text-center shadow-sm"
    >
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <FiShoppingBag size={34} className="text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Your cart is empty</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Browse restaurants and add items to get started.</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors"
      >
        Explore restaurants <FiChevronRight size={14} />
      </Link>
    </motion.div>
  );
}

// ─── Conflict dialog (different restaurant) ───────────────────────────────────
function ConflictDialog({ onResolve, onDismiss, restaurantName }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 p-6"
      >
        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
          <FiAlertCircle size={22} className="text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="mt-4 text-center text-base font-semibold text-slate-900 dark:text-slate-50">Start a new cart?</h3>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          Your cart has items from <strong className="text-slate-700 dark:text-slate-200">{restaurantName}</strong>. Adding from a different restaurant will clear your current cart.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={onDismiss} className="flex-1 rounded-full py-2.5 text-sm font-semibold ring-1 ring-slate-200 dark:ring-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Keep current
          </button>
          <button onClick={onResolve} className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
            Start fresh
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Address form ─────────────────────────────────────────────────────────────
function AddressForm({ value, onChange }) {
  const fields = [
    { key: "street",  label: "Street / Area",  placeholder: "12, MG Road, Andheri West" },
    { key: "city",    label: "City",            placeholder: "Mumbai" },
    { key: "pincode", label: "PIN code",        placeholder: "400053" },
    { key: "notes",   label: "Delivery notes",  placeholder: "Ring bell, leave at door… (optional)" },
  ];
  return (
    <div className="space-y-3">
      {fields.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
          <input
            value={value[key] || ""}
            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            placeholder={placeholder}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        </div>
      ))}
    </div>
  );
}

// ─── Order success overlay ────────────────────────────────────────────────────
function OrderSuccess({ orderId, etaMinutes, fulfillmentType, onClose }) {
  const navigate = useNavigate();
  const isPickup = fulfillmentType === "pickup";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.15, stiffness: 200 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40"
        >
          <FiCheck size={28} className="text-emerald-600 dark:text-emerald-400" />
        </motion.div>
        <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-slate-50">Order placed!</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {isPickup
            ? <>Your order will be ready for <strong className="text-slate-700 dark:text-slate-200">pickup</strong> in approx. <strong className="text-slate-700 dark:text-slate-200">{etaMinutes} min</strong>.</>
            : <>Estimated delivery in <strong className="text-slate-700 dark:text-slate-200">{etaMinutes} min</strong>.</>
          }
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 font-mono">#{orderId.slice(-8).toUpperCase()}</p>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-full py-2.5 text-sm font-semibold ring-1 ring-slate-200 dark:ring-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Continue shopping
          </button>
          <button onClick={() => navigate("/orders")} className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
            Track order
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Cart component ──────────────────────────────────────────────────────
function Cart() {
  const {
    items, restaurantName, pendingConflict,
    totalItems, subtotal, tax, deliveryFee, total, etaMinutes,
    freeDeliveryAbove, resolveConflict, dismissConflict, clearCart,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress]           = useState({ street: "", city: "", pincode: "", notes: "" });
  const [fulfillmentType, setFulfillment] = useState("delivery"); // "delivery" | "pickup"
  const [placing, setPlacing]             = useState(false);
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState(null);

  const handleCheckout = async () => {
    if (!user) { navigate("/login"); return; }
    if (fulfillmentType === "delivery" && (!address.street || !address.city || !address.pincode)) {
      setError("Please fill in your delivery address."); return;
    }
    setError("");
    setPlacing(true);
    try {
      const payload = {
        restaurantId: items[0]?.restaurantId,
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        deliveryAddress: fulfillmentType === "pickup" ? {} : address,
        fulfillmentType,
      };
      const { data } = await placeOrder(payload);
      setSuccess({ orderId: data.data._id, etaMinutes: data.meta.etaMinutes, fulfillmentType });
      clearCart();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <section className="pt-10 pb-20">
      {pendingConflict && (
        <ConflictDialog restaurantName={restaurantName} onResolve={resolveConflict} onDismiss={dismissConflict} />
      )}
      {success && (
        <OrderSuccess orderId={success.orderId} etaMinutes={success.etaMinutes} fulfillmentType={success.fulfillmentType} onClose={() => setSuccess(null)} />
      )}

      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Cart
            {totalItems > 0 && (
              <span className="ml-2 text-lg font-normal text-slate-400">({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
            )}
          </h1>
          {restaurantName && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              From <span className="font-medium text-slate-700 dark:text-slate-200">{restaurantName}</span>
            </p>
          )}
        </div>
        {items.length > 0 && (
          <button onClick={clearCart} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
            Clear cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.6fr,minmax(0,1fr)] items-start">
          {/* Left — items + address */}
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <CartItemRow key={item.menuItemId} item={item} />
              ))}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-5"
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">How would you like to receive your order?</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { value: "delivery", label: "Home Delivery", icon: "📦", desc: "Delivered to your address" },
                  { value: "pickup",   label: "Store Pickup",  icon: "📍", desc: "Collect from the store" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFulfillment(opt.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                      fulfillmentType === opt.value
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-orange-200"
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="font-semibold">{opt.label}</span>
                    <span className="text-xs text-slate-400 font-normal">{opt.desc}</span>
                  </button>
                ))}
              </div>

              {fulfillmentType === "delivery" && (
                <>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">
                    <FiMapPin size={15} className="text-primary" /> Delivery address
                  </h3>
                  <AddressForm value={address} onChange={setAddress} />
                </>
              )}

              {fulfillmentType === "pickup" && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">
                  You'll collect your order directly from <strong className="text-slate-700 dark:text-slate-200">{restaurantName}</strong>.
                </p>
              )}
            </motion.div>
          </div>

          {/* Right — summary */}
          <div className="lg:sticky lg:top-24 space-y-4">
            {/* ETA */}
            <div className="flex items-center gap-2 rounded-2xl bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20 px-4 py-3">
              <FiClock size={15} className="text-primary shrink-0" />
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {fulfillmentType === "pickup" ? "Ready for pickup in" : "Estimated delivery:"} <strong>{etaMinutes} min</strong>
              </p>
            </div>

            {/* Free delivery nudge */}
            {fulfillmentType === "delivery" && subtotal < freeDeliveryAbove && (
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Add <strong><Money value={freeDeliveryAbove - subtotal} /></strong> more for free delivery
              </p>
            )}

            {/* Price breakdown */}
            <div className="rounded-2xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Order summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-medium"><Money value={subtotal} /></span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Tax (5%)</span>
                  <span className="font-medium"><Money value={tax} /></span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Delivery</span>
                  {fulfillmentType === "pickup" || deliveryFee === 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      <FiCheck size={10} /> {fulfillmentType === "pickup" ? "N/A" : "Free"}
                    </span>
                  ) : (
                    <span className="font-medium"><Money value={deliveryFee} /></span>
                  )}
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Total</span>
                  <span className="font-bold text-lg text-slate-900 dark:text-slate-50">
                    <Money value={fulfillmentType === "pickup" ? subtotal + tax : total} />
                  </span>
                </div>
              </div>

              {error && (
                <p className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                  <FiAlertCircle size={13} /> {error}
                </p>
              )}

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckout}
                disabled={placing}
                className="mt-4 w-full inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {placing ? "Placing order…" : user ? "Place Order" : "Login to checkout"}
              </motion.button>

              <p className="mt-2.5 text-center text-xs text-slate-400 dark:text-slate-500">
                Prices are locked at checkout. No hidden fees.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Cart;
