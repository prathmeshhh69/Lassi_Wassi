import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MdRefresh, MdAccessTime, MdPerson, MdPhone, MdEmail,
    MdLocationOn, MdClose, MdCheckCircle, MdLocalShipping,
    MdRestaurant, MdCancel, MdReceipt, MdExpandMore, MdExpandLess,
} from "react-icons/md";
import PageHeader from "../../components/owner/PageHeader";
import StatusBadge from "../../components/owner/StatusBadge";
import Modal from "../../components/owner/Modal";
import { fetchOrders, fetchOrderById, updateOrderStatus } from "../../services/ownerApi";
import { useOwnerRestaurant } from "../../context/OwnerRestaurantContext";
import { useSocket } from "../../context/SocketContext";

// ─── Constants ───────────────────────────────────────────────────────────────
const ORDER_STATUSES = ["pending", "preparing", "out_for_delivery", "completed", "cancelled"];

const STATUS_META = {
    pending:          { label: "Pending",          color: "bg-yellow-500",  light: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200" },
    preparing:        { label: "Preparing",         color: "bg-blue-500",    light: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"   },
    out_for_delivery: { label: "Out for Delivery",  color: "bg-purple-500",  light: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
    completed:        { label: "Completed",         color: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200"},
    cancelled:        { label: "Cancelled",         color: "bg-red-400",     light: "bg-red-50",     text: "text-red-600",     border: "border-red-200"    },
};

// What action buttons appear per status
const NEXT_ACTIONS = {
    pending:          [{ label: "Accept",         icon: <MdRestaurant size={14}/>,    next: "preparing",        cls: "bg-blue-500 hover:bg-blue-600 text-white"  },
                       { label: "Cancel",          icon: <MdCancel size={14}/>,        next: "cancelled",        cls: "bg-red-100 hover:bg-red-200 text-red-600"  }],
    preparing:        [{ label: "Out for Delivery",icon: <MdLocalShipping size={14}/>, next: "out_for_delivery", cls: "bg-purple-500 hover:bg-purple-600 text-white"}],
    out_for_delivery: [{ label: "Mark Delivered",  icon: <MdCheckCircle size={14}/>,   next: "completed",        cls: "bg-emerald-500 hover:bg-emerald-600 text-white"}],
    completed:        [],
    cancelled:        [],
};

const FILTER_TABS = [
    { key: "",                label: "All",         icon: "📋" },
    { key: "pending",         label: "Pending",     icon: "⏳" },
    { key: "preparing",       label: "Preparing",   icon: "👨‍🍳" },
    { key: "out_for_delivery",label: "On the Way",  icon: "🚴" },
    { key: "completed",       label: "Done",        icon: "✅" },
    { key: "cancelled",       label: "Cancelled",   icon: "❌" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)  return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString();
}

// ─── Small reusable pieces ────────────────────────────────────────────────────
const FulfillmentBadge = ({ type }) => (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 ${
        type === "pickup"
            ? "bg-sky-50 text-sky-700 border border-sky-200"
            : "bg-teal-50 text-teal-700 border border-teal-200"
    }`}>
        {type === "pickup" ? "📍 Pickup" : "📦 Delivery"}
    </span>
);

const TypeBadge = ({ orderType, scheduledTime }) =>
    orderType === "pre-order" && scheduledTime ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 whitespace-nowrap">
            <MdAccessTime size={11} />
            {new Date(scheduledTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5">
            ⚡ Instant
        </span>
    );

// ─── Order Card ──────────────────────────────────────────────────────────────
const OrderCard = ({ order, isNew, onAction, updatingId, onDetail }) => {
    const meta   = STATUS_META[order.status] ?? STATUS_META.pending;
    const actions = NEXT_ACTIONS[order.status] ?? [];
    const busy   = updatingId === order._id;
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col
                ${isNew ? "ring-2 ring-orange-400 ring-offset-1" : "border-gray-100"}`}
        >
            {/* Left status strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${meta.color}`} />

            {/* NEW badge */}
            <AnimatePresence>
                {isNew && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-3 right-3 z-10"
                    >
                        <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5 animate-pulse shadow">
                            🔔 NEW
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Card body */}
            <div className="pl-5 pr-4 pt-4 pb-3 flex-1 space-y-3">
                {/* Row 1 — customer + amount */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                            {(order.user?.name ?? "G")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate leading-tight">
                                {order.user?.name ?? "Guest"}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                                {order.user?.phone ?? order.user?.email ?? "—"}
                            </p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-gray-900 leading-tight">₹{order.totalAmount}</p>
                        <p className="text-[11px] text-gray-400">{order.items?.length ?? 0} item{order.items?.length !== 1 ? "s" : ""}</p>
                    </div>
                </div>

                {/* Row 2 — badges */}
                <div className="flex flex-wrap gap-1.5 items-center">
                    <FulfillmentBadge type={order.fulfillmentType ?? "delivery"} />
                    <TypeBadge orderType={order.orderType} scheduledTime={order.scheduledTime} />
                    <span className={`inline-flex items-center text-[11px] font-semibold rounded-full px-2 py-0.5 border ${meta.light} ${meta.text} ${meta.border}`}>
                        {meta.label}
                    </span>
                </div>

                {/* Row 3 — items preview (collapsed/expanded) */}
                {order.items?.length > 0 && (
                    <div className={`overflow-hidden transition-all duration-200 ${expanded ? "" : "max-h-0"}`}>
                        <div className="bg-gray-50 rounded-xl px-3 py-2 space-y-1 mt-1">
                            {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-xs text-gray-600">
                                    <span>{item.menuItem?.name ?? "Item"} × {item.quantity}</span>
                                    <span className="font-medium">₹{(item.price ?? 0) * item.quantity}</span>
                                </div>
                            ))}
                            {order.fulfillmentType === "delivery" && order.deliveryAddress?.street && (
                                <p className="text-[11px] text-gray-400 pt-1 border-t border-gray-200 flex items-center gap-1">
                                    <MdLocationOn size={11} />
                                    {order.deliveryAddress.street}, {order.deliveryAddress.city}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Toggle items */}
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-orange-500 transition-colors -mt-1"
                >
                    {expanded ? <MdExpandLess size={14}/> : <MdExpandMore size={14}/>}
                    {expanded ? "Hide items" : "Show items"}
                </button>
            </div>

            {/* Card footer */}
            <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between gap-2 bg-gray-50/60">
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <MdAccessTime size={12} /> {timeAgo(order.createdAt)}
                </span>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Quick-action buttons */}
                    {actions.map((action) => (
                        <button
                            key={action.next}
                            disabled={busy}
                            onClick={() => onAction(order._id, action.next)}
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50 ${action.cls}`}
                        >
                            {busy ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : action.icon}
                            {action.label}
                        </button>
                    ))}

                    {/* Details button */}
                    <button
                        onClick={() => onDetail(order)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-all"
                    >
                        <MdReceipt size={13} /> Details
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Stat chip ────────────────────────────────────────────────────────────────
const StatChip = ({ label, value, color }) => (
    <div className={`flex flex-col items-center justify-center rounded-2xl px-5 py-3 border ${color} min-w-[90px]`}>
        <span className="text-xl font-bold leading-tight">{value}</span>
        <span className="text-[11px] font-medium mt-0.5 opacity-75 uppercase tracking-wide">{label}</span>
    </div>
);

// ─── Main component ────────────────────────────────────────────────────────────
const OwnerOrders = () => {
    const { restaurant } = useOwnerRestaurant();
    const { socket } = useSocket();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [detailOrder, setDetailOrder] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [meta, setMeta] = useState({ total: 0, page: 1 });
    const [newIds, setNewIds] = useState(new Set());

    const newIdsRef = useRef(newIds);
    newIdsRef.current = newIds;

    const load = (page = 1) => {
        if (!restaurant?._id) { setLoading(false); return; }
        setLoading(true);
        fetchOrders(restaurant._id, { status: statusFilter || undefined, page, limit: 20 })
            .then(({ data }) => {
                setOrders(data.data ?? []);
                setMeta(data.meta ?? { total: 0, page });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(1); }, [restaurant, statusFilter]);

    // ── Socket ──
    useEffect(() => {
        if (!socket || !restaurant?._id) return;
        const roomId = restaurant._id;
        const joinRoom = () => socket.emit("joinRestaurant", roomId);
        joinRoom();
        socket.on("connect", joinRoom);

        const handleNewOrder = (newOrder) => {
            setOrders(prev =>
                prev.some((o) => o._id === newOrder._id)
                    ? prev
                    : [newOrder, ...prev]
            );
            // Mark as new — auto-clear after 30s
            setNewIds(prev => new Set([...prev, newOrder._id]));
            setTimeout(() => {
                setNewIds(prev => { const s = new Set(prev); s.delete(newOrder._id); return s; });
            }, 30000);
        };

        socket.on("newOrder", handleNewOrder);
        return () => {
            socket.off("connect", joinRoom);
            socket.off("newOrder", handleNewOrder);
        };
    }, [socket, restaurant?._id]);

    const handleStatusUpdate = async (orderId, status) => {
        setUpdatingId(orderId);
        try {
            const { data } = await updateOrderStatus(orderId, status);
            setOrders(prev => prev.map(o => o._id === orderId ? data.data : o));
            // If moved to completed/cancelled, clear new badge
            if (status === "completed" || status === "cancelled") {
                setNewIds(prev => { const s = new Set(prev); s.delete(orderId); return s; });
            }
        } catch (err) {
            alert(err?.response?.data?.message ?? "Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    const openDetail = async (order) => {
        setDetailOpen(true);
        setDetailLoading(true);
        try {
            const { data } = await fetchOrderById(restaurant._id, order._id);
            setDetailOrder(data.data);
        } catch { setDetailOrder(order); }
        finally { setDetailLoading(false); }
    };

    // ── Derived counts for stat chips ──
    const counts = ORDER_STATUSES.reduce((acc, s) => {
        acc[s] = orders.filter(o => o.status === s).length;
        return acc;
    }, {});

    const visibleOrders = statusFilter
        ? orders.filter(o => o.status === statusFilter)
        : orders;

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="Orders"
                description="Manage and update live orders in real time"
                action={
                    <button
                        onClick={() => load(1)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm"
                    >
                        <MdRefresh size={16} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                }
            />

            {/* Stat chips */}
            <div className="flex gap-3 flex-wrap">
                <StatChip label="Pending"    value={counts.pending}          color="bg-yellow-50 border-yellow-200 text-yellow-700" />
                <StatChip label="Preparing"  value={counts.preparing}        color="bg-blue-50 border-blue-200 text-blue-700" />
                <StatChip label="On the way" value={counts.out_for_delivery} color="bg-purple-50 border-purple-200 text-purple-700" />
                <StatChip label="Done today" value={counts.completed}        color="bg-emerald-50 border-emerald-200 text-emerald-700" />
                <StatChip label="Cancelled"  value={counts.cancelled}        color="bg-red-50 border-red-200 text-red-500" />
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-1.5 flex-wrap">
                {FILTER_TABS.map((tab) => {
                    const count = tab.key ? orders.filter(o => o.status === tab.key).length : orders.length;
                    const active = statusFilter === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                active
                                    ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600"
                            }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                                active ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Cards grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 h-44 animate-pulse" />
                    ))}
                </div>
            ) : visibleOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="text-5xl mb-4">🍽️</span>
                    <p className="text-gray-500 font-medium">No orders here yet</p>
                    <p className="text-gray-400 text-sm mt-1">New orders will appear instantly when placed</p>
                </div>
            ) : (
                <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {visibleOrders.map((order) => (
                            <OrderCard
                                key={order._id}
                                order={order}
                                isNew={newIds.has(order._id)}
                                onAction={handleStatusUpdate}
                                updatingId={updatingId}
                                onDetail={openDetail}
                            />
                        ))}
                    </div>
                </AnimatePresence>
            )}

            {/* Pagination */}
            {meta.total > 20 && !loading && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-gray-400">{meta.total} total orders</p>
                    <div className="flex gap-2">
                        <button
                            disabled={meta.page <= 1}
                            onClick={() => load(meta.page - 1)}
                            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                        >
                            ← Prev
                        </button>
                        <span className="px-3 py-2 text-xs text-gray-500">Page {meta.page}</span>
                        <button
                            disabled={meta.page * 20 >= meta.total}
                            onClick={() => load(meta.page + 1)}
                            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}

            {/* Order detail modal */}
            <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Order Details" maxWidth="max-w-lg">
                {detailLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                    </div>
                ) : detailOrder ? (
                    <div className="space-y-5">
                        {/* Customer info */}
                        <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg shrink-0">
                                {(detailOrder.user?.name ?? "G")[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 text-base">{detailOrder.user?.name ?? "Guest"}</p>
                                {detailOrder.user?.phone && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                        <MdPhone size={13} />{detailOrder.user.phone}
                                    </p>
                                )}
                                {detailOrder.user?.email && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <MdEmail size={13} />{detailOrder.user.email}
                                    </p>
                                )}
                            </div>
                            <StatusBadge status={detailOrder.status} />
                        </div>

                        {/* Fulfillment + type */}
                        <div className="flex flex-wrap gap-2">
                            <FulfillmentBadge type={detailOrder.fulfillmentType ?? "delivery"} />
                            <TypeBadge orderType={detailOrder.orderType} scheduledTime={detailOrder.scheduledTime} />
                        </div>

                        {/* Delivery address */}
                        {detailOrder.fulfillmentType !== "pickup" && detailOrder.deliveryAddress?.street && (
                            <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-4 py-3">
                                <MdLocationOn size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                <p className="text-sm text-gray-600">
                                    {detailOrder.deliveryAddress.street},&nbsp;
                                    {detailOrder.deliveryAddress.city}&nbsp;
                                    {detailOrder.deliveryAddress.pincode}
                                </p>
                            </div>
                        )}

                        {/* Scheduled info */}
                        {detailOrder.orderType === "pre-order" && detailOrder.scheduledTime && (
                            <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                <MdAccessTime size={18} className="text-amber-600 shrink-0" />
                                <div>
                                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">Pre-Order — Scheduled Pickup</p>
                                    <p className="text-sm font-bold text-amber-800 mt-0.5">
                                        {new Date(detailOrder.scheduledTime).toLocaleString([], { dateStyle: "full", timeStyle: "short" })}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Items */}
                        <div className="bg-gray-50 rounded-xl overflow-hidden">
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide px-4 pt-3 pb-1">Order Items</p>
                            <div className="divide-y divide-gray-100">
                                {(detailOrder.items ?? []).map((item, i) => (
                                    <div key={i} className="flex justify-between items-center px-4 py-2.5 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-800">{item.menuItem?.name ?? "Item"}</span>
                                            <span className="text-gray-400 ml-1">× {item.quantity}</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">₹{(item.price ?? 0) * item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center px-4 py-3 bg-white border-t border-gray-100">
                                <span className="font-bold text-gray-800">Total</span>
                                <span className="font-black text-lg text-gray-900">₹{detailOrder.totalAmount}</span>
                            </div>
                        </div>

                        {/* Quick actions inside modal */}
                        {(NEXT_ACTIONS[detailOrder.status] ?? []).length > 0 && (
                            <div className="flex gap-2 flex-wrap pt-1">
                                {(NEXT_ACTIONS[detailOrder.status] ?? []).map((action) => (
                                    <button
                                        key={action.next}
                                        disabled={updatingId === detailOrder._id}
                                        onClick={async () => {
                                            await handleStatusUpdate(detailOrder._id, action.next);
                                            setDetailOrder(prev => prev ? { ...prev, status: action.next } : prev);
                                        }}
                                        className={`flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 ${action.cls}`}
                                    >
                                        {updatingId === detailOrder._id
                                            ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            : action.icon
                                        }
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <p className="text-[11px] text-gray-400 text-center">
                            Placed {new Date(detailOrder.createdAt).toLocaleString()}
                        </p>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

export default OwnerOrders;
