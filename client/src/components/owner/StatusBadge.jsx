/**
 * StatusBadge — colored pill for order/booking status
 */
const PALETTE = {
    // Orders
    pending:          "bg-yellow-50  text-yellow-700  border-yellow-200",
    preparing:        "bg-blue-50    text-blue-700    border-blue-200",
    out_for_delivery: "bg-purple-50  text-purple-700  border-purple-200",
    completed:        "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled:        "bg-red-50     text-red-700     border-red-200",
    // Bookings
    confirmed:        "bg-emerald-50 text-emerald-700 border-emerald-200",
    no_show:          "bg-gray-100   text-gray-600    border-gray-200",
};

const LABELS = {
    pending:          "Pending",
    preparing:        "Preparing",
    out_for_delivery: "Out for Delivery",
    completed:        "Completed",
    cancelled:        "Cancelled",
    confirmed:        "Confirmed",
    no_show:          "No Show",
};

const StatusBadge = ({ status }) => (
    <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            PALETTE[status] ?? "bg-gray-100 text-gray-600 border-gray-200"
        }`}
    >
        {LABELS[status] ?? status}
    </span>
);

export default StatusBadge;
