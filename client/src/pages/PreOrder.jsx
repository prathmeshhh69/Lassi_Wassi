import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CalendarPicker from "../components/ui/CalendarPicker";
import TimeSlotGrid from "../components/ui/TimeSlotGrid";
import { getPreOrderSlots, createPreOrder } from "../services/bookingApi";
import api from "../services/api";

/* ─── tiny helpers ─────────────────────────────────────────── */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/* ─── SuccessOverlay ────────────────────────────────────────── */
function SuccessOverlay({ order, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-3xl">
          🎉
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Order Scheduled!</h2>
        <p className="text-gray-500 text-sm mb-4">
          Your pre-order has been placed for{" "}
          <span className="font-semibold text-gray-700">
            {new Date(order.scheduledTime).toLocaleString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          .
        </p>
        <p className="text-orange-600 font-semibold text-lg mb-6">Total: ₹{order.total}</p>
        <button
          onClick={onClose}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

/* ─── ItemCard ──────────────────────────────────────────────── */
function ItemCard({ item, qty, onAdd, onRemove }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-orange-200 transition-colors">
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
          className="w-14 h-14 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-orange-50 flex items-center justify-center text-2xl shrink-0">
          🍽️
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
        <p className="text-orange-500 font-semibold text-sm">₹{item.price}</p>
        {item.description && (
          <p className="text-gray-400 text-xs truncate">{item.description}</p>
        )}
      </div>
      {qty === 0 ? (
        <button
          onClick={onAdd}
          className="shrink-0 w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg transition-colors flex items-center justify-center"
        >
          +
        </button>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg transition-colors flex items-center justify-center"
          >
            −
          </button>
          <span className="w-5 text-center font-semibold text-gray-800 text-sm">{qty}</span>
          <button
            onClick={onAdd}
            className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg transition-colors flex items-center justify-center"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function PreOrder() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // date / slot
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);

  // restaurant & menu
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);

  // item quantities  { itemId: qty }
  const [quantities, setQuantities] = useState({});

  // delivery address form
  const [address, setAddress] = useState({ street: "", city: "", pincode: "", notes: "" });

  // submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successOrder, setSuccessOrder] = useState(null);

  /* ── fetch restaurant + menu ── */
  useEffect(() => {
    (async () => {
      try {
        const [rRes, mRes] = await Promise.all([
          api.get(`/api/restaurants/${restaurantId}`),
          api.get(`/api/restaurants/${restaurantId}/menu`),
        ]);
        setRestaurant(rRes.data.data ?? rRes.data);
        setMenuItems(mRes.data.data ?? mRes.data ?? []);
      } catch {
        setError("Failed to load restaurant details.");
      } finally {
        setMenuLoading(false);
      }
    })();
  }, [restaurantId]);

  /* ── fetch slots on date change ── */
  const fetchSlots = useCallback(
    async (d) => {
      setSlotsLoading(true);
      setSelectedTime(null);
      try {
        const res = await getPreOrderSlots(restaurantId, d);
        setSlots(res.data.data ?? res.data ?? []);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [restaurantId]
  );

  useEffect(() => {
    fetchSlots(date);
  }, [date, fetchSlots]);

  /* ── helpers ── */
  const addItem = (id) =>
    setQuantities((q) => ({ ...q, [id]: (q[id] || 0) + 1 }));
  const removeItem = (id) =>
    setQuantities((q) => {
      const next = { ...q, [id]: Math.max((q[id] || 0) - 1, 0) };
      if (next[id] === 0) delete next[id];
      return next;
    });

  const selectedItems = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ menuItem: id, quantity: qty }));

  const subtotal = menuItems.reduce(
    (sum, item) => sum + (quantities[item._id] || 0) * item.price,
    0
  );
  const valid =
    selectedTime &&
    selectedItems.length > 0 &&
    address.street.trim() &&
    address.city.trim() &&
    address.pincode.trim();

  /* ── submit ── */
  const handleSubmit = async () => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (!valid) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        restaurantId,
        items: selectedItems,
        scheduledTime: `${date}T${selectedTime}:00`,
        deliveryAddress: address,
      };
      const res = await createPreOrder(payload);
      setSuccessOrder(res.data.data ?? res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not place pre-order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── success handler ── */
  const handleSuccessClose = () => {
    navigate("/orders");
  };

  /* ─────────────────────────────── Render ─────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50">
      {successOrder && (
        <SuccessOverlay order={successOrder} onClose={handleSuccessClose} />
      )}

      {/* Hero strip */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-medium opacity-80 mb-1">
            {restaurant?.cuisine || "Restaurant"} · Pre-Order
          </p>
          <h1 className="text-3xl font-bold leading-tight">
            {restaurant?.name || "Loading…"}
          </h1>
          <p className="mt-2 opacity-80 text-sm">
            Schedule your delivery in advance — pick a date and time slot.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* ── Section 1: Date ── */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">1. Pick a Date</h2>
          <CalendarPicker selected={date} onChange={setDate} />
        </section>

        {/* ── Section 2: Time Slot ── */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-1">2. Choose a Time Slot</h2>
          <p className="text-gray-400 text-xs mb-2">
            Slots fill up fast — bar shows current occupancy.
          </p>
          <TimeSlotGrid
            slots={slots}
            selected={selectedTime}
            onSelect={setSelectedTime}
            loading={slotsLoading}
            emptyMessage="No pre-order slots available for this date. Try another day."
          />
        </section>

        {/* ── Section 3: Menu ── */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">3. Select Items</h2>
          {menuLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : menuItems.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">
              No menu items found for this restaurant.
            </p>
          ) : (
            <div className="space-y-3">
              {menuItems.map((item) => (
                <ItemCard
                  key={item._id}
                  item={item}
                  qty={quantities[item._id] || 0}
                  onAdd={() => addItem(item._id)}
                  onRemove={() => removeItem(item._id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Section 4: Delivery Address ── */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">4. Delivery Address</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Street / Flat / Building *"
              value={address.street}
              onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="City *"
                value={address.city}
                onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <input
                type="text"
                placeholder="Pincode *"
                value={address.pincode}
                onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value }))}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <input
              type="text"
              placeholder="Landmark / Delivery notes (optional)"
              value={address.notes}
              onChange={(e) => setAddress((a) => ({ ...a, notes: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </section>

        {/* ── Order Summary + Submit ── */}
        {selectedItems.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm sticky bottom-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Subtotal ({selectedItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span>₹{subtotal}</span>
            </div>
            {selectedTime && (
              <div className="flex justify-between text-sm text-orange-600 font-medium mb-3">
                <span>Slot</span>
                <span>
                  {date} @ {selectedTime}
                </span>
              </div>
            )}
            <button
              disabled={!valid || submitting}
              onClick={handleSubmit}
              className={`w-full py-3 rounded-xl font-bold text-white text-sm transition-colors ${
                valid && !submitting
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {submitting
                ? "Placing order…"
                : !selectedTime
                ? "Select a time slot"
                : !address.street
                ? "Enter delivery address"
                : `Schedule Pre-Order · ₹${subtotal}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
