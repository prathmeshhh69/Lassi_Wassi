import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "../components/Layout.jsx";
import SectionTitle from "../components/ui/SectionTitle.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { placeOrder } from "../services/orderApi.js";

const STEPS = ["Cart Review", "Order Options", "Confirm & Pay"];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10 select-none">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i < current
                  ? "bg-orange-500 border-orange-500 text-white"
                  : i === current
                  ? "bg-white border-orange-500 text-orange-500"
                  : "bg-white border-gray-200 text-gray-300"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`text-xs mt-1 font-medium ${i === current ? "text-orange-500" : i < current ? "text-gray-600" : "text-gray-300"}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-12 sm:w-20 h-0.5 mx-1 mb-5 ${i < current ? "bg-orange-500" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Checkout() {
  const navigate              = useNavigate();
  const { user }              = useAuth();
  const {
    items, restaurantId, restaurantName,
    subtotal, tax, deliveryFee, total, clearCart,
  } = useCart();

  const [step, setStep]                   = useState(0);
  const [address, setAddress]             = useState({ street: "", city: "", pincode: "", notes: "" });
  const [fulfillmentType, setFulfillment] = useState("delivery"); // "delivery" | "pickup"
  const [orderType, setOrderType]         = useState("instant");
  const [scheduledTime, setScheduled]     = useState("");
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState("");

  const DELIVERY_FEE = fulfillmentType === "pickup" ? 0 : deliveryFee;

  const addressValid = fulfillmentType === "pickup" ||
    (address.street.trim() && address.city.trim() && address.pincode.trim());

  // Minimum datetime string = now + 10 min, rounded up to next minute
  const minScheduled = (() => {
    const d = new Date(Date.now() + 10 * 60 * 1000);
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  })();

  const scheduledValid = orderType === "instant" || (scheduledTime && scheduledTime >= minScheduled);

  const handlePlaceOrder = async () => {
    if (!user) { navigate("/login"); return; }
    if (!scheduledValid) { setError("Please select a pickup time at least 10 minutes from now."); return; }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        restaurantId,
        items: items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        deliveryAddress: fulfillmentType === "pickup" ? {} : address,
        orderType,
        fulfillmentType,
        scheduledTime: orderType === "pre-order" ? new Date(scheduledTime).toISOString() : undefined,
      };
      const res = await placeOrder(payload);
      clearCart();
      navigate("/orders", { state: { newOrder: res.data.data ?? res.data } });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          message="Add some items from our menu before checking out."
          action={{ label: "Browse Menu", onClick: () => navigate("/menu") }}
        />
      </Layout>
    );
  }

  return (
    <Layout pageKey="checkout">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <SectionTitle title="Checkout" subtitle={`${items.length} item(s) from ${restaurantName}`} size="lg" className="mb-8" />
        <StepIndicator current={step} />

        {/* ── Step 0: Review cart ── */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="space-y-3 mb-6">
              {items.map(item => (
                <div key={item.menuItemId} className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center overflow-hidden shrink-0">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🍽️</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">₹{item.price} × {item.quantity}</p>
                  </div>
                  <p className="font-bold text-gray-900 shrink-0">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
            {/* Bill summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between text-gray-600"><span>GST (5%)</span><span>₹{tax}</span></div>
              <div className="flex justify-between text-gray-600"><span>Delivery fee</span><span>{DELIVERY_FEE === 0 ? <span className="text-emerald-600">Free</span> : `₹${DELIVERY_FEE}`}</span></div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
            </div>
            <Button full size="lg" onClick={() => setStep(1)}>Continue to Order Options</Button>
          </motion.div>
        )}

        {/* ── Step 1: Address + Order Options ── */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>

            {/* ── Fulfillment Type ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4 space-y-4">
              <p className="text-sm font-semibold text-gray-700">How would you like to receive your order?</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "delivery", label: "Home Delivery", icon: "📦", desc: "Delivered to your address" },
                  { value: "pickup",   label: "Store Pickup",  icon: "📍", desc: "Collect from the store" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFulfillment(opt.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-4 text-sm font-medium transition-all ${
                      fulfillmentType === opt.value
                        ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-gray-200 bg-white text-gray-600 hover:border-orange-200"
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="font-semibold">{opt.label}</span>
                    <span className="text-xs text-gray-400 font-normal">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Address (only for delivery) ── */}
            {fulfillmentType === "delivery" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4 space-y-3"
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery Address</p>
                <input
                  type="text" placeholder="Street / Flat / Building *" value={address.street}
                  onChange={e => setAddress(a => ({ ...a, street: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="City *" value={address.city}
                    onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <input type="text" placeholder="Pincode *" value={address.pincode}
                    onChange={e => setAddress(a => ({ ...a, pincode: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <input type="text" placeholder="Landmark / notes (optional)" value={address.notes}
                  onChange={e => setAddress(a => ({ ...a, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </motion.div>
            )}

            {fulfillmentType === "pickup" && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-start gap-3 text-sm text-amber-800">
                <span className="text-xl">📍</span>
                <div>
                  <p className="font-semibold">Koregaon Park, Pune</p>
                  <p className="text-xs text-amber-700 mt-0.5">Lassi Wassi — Open 10:00 AM to 11:30 PM</p>
                </div>
              </div>
            )}

            {/* ── Order Type ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 space-y-4">
              <p className="text-sm font-semibold text-gray-700">Order Timing</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "instant",   label: "Order Now",  icon: "⚡", desc: "Delivered ASAP" },
                  { value: "pre-order", label: "Pre-Order",  icon: "🕐", desc: "Schedule a pickup time" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setOrderType(opt.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-4 text-sm font-medium transition-all ${
                      orderType === opt.value
                        ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-gray-200 bg-white text-gray-600 hover:border-orange-200"
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="font-semibold">{opt.label}</span>
                    <span className="text-xs text-gray-400 font-normal">{opt.desc}</span>
                  </button>
                ))}
              </div>

              {orderType === "pre-order" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-1"
                >
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Scheduled Pickup Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    min={minScheduled}
                    onChange={e => setScheduled(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Must be at least 10 minutes from now.</p>
                </motion.div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" onClick={() => setStep(0)} className="flex-1">Back</Button>
              <Button size="lg" disabled={!addressValid || !scheduledValid} onClick={() => setStep(2)} className="flex-1">Review Order</Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Confirm ── */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm mb-4">{error}</div>}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 space-y-2 text-sm">
              <h3 className="font-bold text-gray-800 mb-2">
                {fulfillmentType === "pickup" ? "📍 Store Pickup" : "📦 Delivery to"}
              </h3>
              {fulfillmentType === "delivery" ? (
                <>
                  <p className="text-gray-600">{address.street}, {address.city} — {address.pincode}</p>
                  {address.notes && <p className="text-gray-400">{address.notes}</p>}
                </>
              ) : (
                <p className="text-gray-600">Koregaon Park, Pune — you will collect from the store</p>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 space-y-2 text-sm">
              <h3 className="font-bold text-gray-800 mb-2">Order Type</h3>
              {orderType === "instant" ? (
                <p className="text-gray-600 flex items-center gap-2"><span>⚡</span> Order Now — delivered as soon as possible</p>
              ) : (
                <p className="text-gray-600 flex items-center gap-2">
                  <span>🕐</span> Pre-Order — pickup at{" "}
                  <span className="font-semibold text-orange-600">
                    {new Date(scheduledTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </p>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600"><span>Items</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between text-gray-600"><span>GST + {fulfillmentType === "pickup" ? "No delivery fee" : "Delivery"}</span><span>₹{(tax + DELIVERY_FEE).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100"><span>Total Payable</span><span>₹{total.toFixed(2)}</span></div>
            </div>
            <p className="text-xs text-gray-400 text-center mb-4">Payment on delivery (COD). Online payments coming soon.</p>
            <div className="flex gap-3">
              <Button variant="secondary" size="lg" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button size="lg" loading={submitting} onClick={handlePlaceOrder} className="flex-1">Place Order</Button>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
