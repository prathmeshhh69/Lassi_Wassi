import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CalendarPicker from "../components/ui/CalendarPicker";
import TimeSlotGrid from "../components/ui/TimeSlotGrid";
import { getBookingSlots, createBooking } from "../services/bookingApi";
import api from "../services/api";

/* ─── helpers ───────────────────────────────────────────────── */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ─── SuccessOverlay ────────────────────────────────────────── */
function SuccessOverlay({ booking, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-3xl">
          🍽️
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Table Requested!</h2>
        <p className="text-gray-500 text-sm mb-1">
          <span className="font-semibold text-gray-700">{booking.customerName}</span> — Party of{" "}
          <span className="font-semibold text-gray-700">{booking.partySize}</span>
        </p>
        <p className="text-gray-500 text-sm mb-4">
          {booking.date} at{" "}
          <span className="font-semibold text-orange-600">{booking.time}</span>
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm mb-6">
          ⏳ Awaiting confirmation from the restaurant. You'll be notified once approved.
        </div>
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

/* ─── Main page ─────────────────────────────────────────────── */
export default function Booking() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // date / slot
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [tableCapacity, setTableCapacity] = useState(null);

  // restaurant
  const [restaurant, setRestaurant] = useState(null);
  const [restLoading, setRestLoading] = useState(true);

  // form
  const [form, setForm] = useState({
    customerName: user?.name || "",
    customerPhone: "",
    customerEmail: user?.email || "",
    partySize: 2,
    specialRequest: "",
  });

  // submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successBooking, setSuccessBooking] = useState(null);

  /* ── fetch restaurant config ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/restaurants/${restaurantId}`);
        const r = res.data.data ?? res.data;
        setRestaurant(r);
        setTableCapacity(r.tableCapacity ?? 20);
      } catch {
        setError("Failed to load restaurant details.");
      } finally {
        setRestLoading(false);
      }
    })();
  }, [restaurantId]);

  /* pre-fill name / email when auth loads */
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        customerName: f.customerName || user.name || "",
        customerEmail: f.customerEmail || user.email || "",
      }));
    }
  }, [user]);

  /* ── fetch slots ── */
  const fetchSlots = useCallback(
    async (d) => {
      setSlotsLoading(true);
      setSelectedTime(null);
      try {
        const res = await getBookingSlots(restaurantId, d);
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

  /* ── slot disable: seat check ── */
  const isSlotDisabled = useCallback(
    (slot) => {
      if (!tableCapacity) return false;
      return slot.occupied + form.partySize > tableCapacity;
    },
    [tableCapacity, form.partySize]
  );

  /* ── validation ── */
  const valid =
    selectedTime &&
    form.customerName.trim() &&
    form.customerPhone.trim() &&
    form.partySize >= 1;

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
        date,
        time: selectedTime,
        partySize: Number(form.partySize),
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim() || undefined,
        notes: form.specialRequest.trim() || undefined,
      };
      const res = await createBooking(payload);
      setSuccessBooking(res.data.data ?? res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => navigate("/");

  const maxParty = restaurant?.maxBookingPartySize ?? 10;

  /* ─────────────── Render ─────────────── */
  return (
    <div className="min-h-screen bg-gray-50">
      {successBooking && (
        <SuccessOverlay booking={successBooking} onClose={handleSuccessClose} />
      )}

      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-500 text-white px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium opacity-80 mb-1">
            {restLoading ? "…" : restaurant?.cuisine || "Restaurant"} · Table Booking
          </p>
          <h1 className="text-3xl font-bold leading-tight">
            {restLoading ? "Loading…" : restaurant?.name}
          </h1>
          <p className="mt-2 opacity-80 text-sm">
            Reserve your table in advance — pick a date, time, and party size.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* ── 1. Date ── */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">1. Pick a Date</h2>
          <CalendarPicker selected={date} onChange={setDate} />
        </section>

        {/* ── 2. Party Size ── */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3">2. Party Size</h2>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: maxParty }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => {
                  setForm((f) => ({ ...f, partySize: n }));
                  setSelectedTime(null); // recheck slots
                }}
                className={`w-10 h-10 rounded-full text-sm font-bold border transition-all ${
                  form.partySize === n
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-400"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Slots that can't accommodate your party will be greyed out.
          </p>
        </section>

        {/* ── 3. Time Slot ── */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-1">3. Choose a Time Slot</h2>
          <TimeSlotGrid
            slots={slots}
            selected={selectedTime}
            onSelect={setSelectedTime}
            disabledFn={isSlotDisabled}
            loading={slotsLoading}
            emptyMessage="No time slots available for this date."
          />
        </section>

        {/* ── 4. Guest Details ── */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">4. Guest Details</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Full Name *"
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="tel"
              placeholder="Phone Number *"
              value={form.customerPhone}
              onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={form.customerEmail}
              onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <textarea
              placeholder="Special requests, allergies, occasion… (optional)"
              value={form.specialRequest}
              onChange={(e) => setForm((f) => ({ ...f, specialRequest: e.target.value }))}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>
        </section>

        {/* ── Submit ── */}
        <div className="sticky bottom-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          {selectedTime && (
            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <span>
                Table for <span className="font-bold text-gray-800">{form.partySize}</span>
              </span>
              <span className="font-semibold text-indigo-600">
                {date} @ {selectedTime}
              </span>
            </div>
          )}
          <button
            disabled={!valid || submitting}
            onClick={handleSubmit}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
              valid && !submitting
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {submitting
              ? "Requesting table…"
              : !selectedTime
              ? "Select a time slot to continue"
              : !form.customerName.trim() || !form.customerPhone.trim()
              ? "Fill in your details"
              : `Request Table — ${date} @ ${selectedTime}`}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            Booking subject to confirmation by the restaurant.
          </p>
        </div>
      </div>
    </div>
  );
}
