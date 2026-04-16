import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MdAdd, MdEdit, MdDelete, MdEventSeat } from "react-icons/md";
import PageHeader from "../../components/owner/PageHeader";
import StatusBadge from "../../components/owner/StatusBadge";
import Modal from "../../components/owner/Modal";
import {
    fetchBookings, createBooking, updateBooking,
    updateBookingStatus, deleteBooking
} from "../../services/ownerApi";
import { useOwnerRestaurant } from "../../context/OwnerRestaurantContext";
import { useSocket } from "../../context/SocketContext";

const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed", "no_show"];

const EMPTY_FORM = {
    customerName: "", customerPhone: "", customerEmail: "",
    date: "", time: "", partySize: 2, notes: "", status: "pending"
};

const BookingForm = ({ initial, onSubmit, loading }) => {
    const [form, setForm] = useState(initial ?? EMPTY_FORM);
    const handle = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name *</label>
                    <input name="customerName" value={form.customerName} onChange={handle} required placeholder="Arjun Sharma"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                    <input name="customerPhone" value={form.customerPhone} onChange={handle} required placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input name="customerEmail" type="email" value={form.customerEmail} onChange={handle} placeholder="arjun@email.com"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                    <input name="date" type="date" value={form.date} onChange={handle} required
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Time *</label>
                    <input name="time" type="time" value={form.time} onChange={handle} required
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Party Size *</label>
                    <input name="partySize" type="number" min="1" value={form.partySize} onChange={handle} required
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <select name="status" value={form.status} onChange={handle}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none bg-white">
                        {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                    <textarea name="notes" value={form.notes} onChange={handle} rows={2} placeholder="Window seat, allergies, etc."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none resize-none" />
                </div>
            </div>
            <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-colors disabled:opacity-60">
                {loading ? "Saving…" : "Save Booking"}
            </button>
        </form>
    );
};

const OwnerBookings = () => {
    const { restaurant } = useOwnerRestaurant();
    const { socket }     = useSocket();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [saving, setSaving] = useState(false);

    const load = () => {
        if (!restaurant?._id) { setLoading(false); return; }
        setLoading(true);
        fetchBookings(restaurant._id, {
            status: statusFilter || undefined,
            date: dateFilter || undefined
        })
            .then(({ data }) => setBookings(data.data ?? []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [restaurant, statusFilter, dateFilter]);

    // ── Socket: prepend new bookings created by customers ──
    useEffect(() => {
        if (!socket || !restaurant?._id) return;
        const roomId = restaurant._id;

        const joinRoom = () => socket.emit("joinRestaurant", roomId);
        joinRoom();
        socket.on("connect", joinRoom);

        const onNewBooking = (booking) => {
            if (String(booking.restaurant) !== String(restaurant._id)) return;
            setBookings((prev) => [booking, ...prev]);
        };
        socket.on("newBooking", onNewBooking);
        return () => {
            socket.off("connect",    joinRoom);
            socket.off("newBooking", onNewBooking);
        };
    }, [socket, restaurant?._id]);

    const handleSubmit = async (form) => {
        setSaving(true);
        try {
            if (editItem) {
                const { data } = await updateBooking(editItem._id, form);
                setBookings((prev) => prev.map((b) => (b._id === editItem._id ? data.data : b)));
            } else {
                const { data } = await createBooking(restaurant._id, form);
                setBookings((prev) => [data.data, ...prev]);
            }
            setModalOpen(false);
        } catch (err) {
            alert(err?.response?.data?.message ?? "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleQuickStatus = async (bookingId, status) => {
        try {
            const { data } = await updateBookingStatus(bookingId, status);
            setBookings((prev) => prev.map((b) => (b._id === bookingId ? data.data : b)));
        } catch (err) {
            alert(err?.response?.data?.message ?? "Failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this booking?")) return;
        try {
            await deleteBooking(id);
            setBookings((prev) => prev.filter((b) => b._id !== id));
        } catch (err) {
            alert(err?.response?.data?.message ?? "Failed to delete");
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Bookings"
                description="Manage table reservations"
                action={
                    <button
                        onClick={() => { setEditItem(null); setModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors shadow-sm"
                    >
                        <MdAdd size={18} /> New Booking
                    </button>
                }
            />

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="flex flex-wrap gap-2">
                    {["", ...BOOKING_STATUSES].map((s) => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                statusFilter === s
                                    ? "bg-orange-500 text-white border-orange-500"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                            }`}>
                            {s ? s.replace(/_/g, " ") : "All"}
                        </button>
                    ))}
                </div>
                <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" />
                {dateFilter && (
                    <button onClick={() => setDateFilter("")} className="text-xs text-gray-400 hover:text-gray-600 px-2">Clear date</button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                </div>
            ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                    <MdEventSeat className="text-gray-300" size={48} />
                    <p className="text-gray-400 text-sm">No bookings found</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {bookings.map((booking, i) => (
                        <motion.div
                            key={booking._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <p className="font-semibold text-gray-900 text-sm">{booking.customerName}</p>
                                        <StatusBadge status={booking.status} />
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                                        <span>{booking.customerPhone}</span>
                                        {booking.customerEmail && <span>{booking.customerEmail}</span>}
                                    </div>
                                    {booking.notes && (
                                        <p className="text-xs text-gray-400 mt-1 italic">{booking.notes}</p>
                                    )}
                                </div>

                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-semibold text-gray-800">
                                        {booking.date} · {booking.time}
                                    </p>
                                    <p className="text-xs text-gray-500">{booking.partySize} guests</p>
                                </div>
                            </div>

                            {/* Quick status + actions */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 flex-wrap gap-2">
                                <div className="flex gap-1.5 flex-wrap">
                                    {booking.status === "pending" && (
                                        <button onClick={() => handleQuickStatus(booking._id, "confirmed")}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors border border-emerald-200">
                                            Confirm
                                        </button>
                                    )}
                                    {(booking.status === "pending" || booking.status === "confirmed") && (
                                        <button onClick={() => handleQuickStatus(booking._id, "cancelled")}
                                            className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors border border-red-200">
                                            Cancel
                                        </button>
                                    )}
                                    {booking.status === "confirmed" && (
                                        <button onClick={() => handleQuickStatus(booking._id, "completed")}
                                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                                            Mark Complete
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => { setEditItem(booking); setModalOpen(true); }}
                                        className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
                                        <MdEdit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(booking._id)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                        <MdDelete size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit Booking" : "New Booking"} maxWidth="max-w-xl">
                <BookingForm initial={editItem ? { ...editItem } : undefined} onSubmit={handleSubmit} loading={saving} />
            </Modal>
        </div>
    );
};

export default OwnerBookings;
