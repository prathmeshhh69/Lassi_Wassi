import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer,
} from "recharts";
import {
    MdBarChart, MdRefresh, MdAttachMoney, MdShoppingBag,
    MdEventSeat, MdTrendingUp, MdTrendingDown,
    MdOutlineShoppingCart, MdCheckCircle, MdPieChart,
} from "react-icons/md";
import StatCard    from "../../components/owner/StatCard";
import PageHeader  from "../../components/owner/PageHeader";
import StatusBadge from "../../components/owner/StatusBadge";
import { fetchAnalytics } from "../../services/ownerApi";
import { useOwnerRestaurant } from "../../context/OwnerRestaurantContext";

/* ─── palette ────────────────────────────────────────────────────────────────── */
const STATUS_COLORS = {
    pending:          "#f97316",
    preparing:        "#3b82f6",
    out_for_delivery: "#8b5cf6",
    completed:        "#10b981",
    cancelled:        "#ef4444",
};
const CHART_ORANGE  = "#f97316";
const CHART_AMBER   = "#fbbf24";
const CHART_BLUE    = "#3b82f6";
const CHART_GREEN   = "#10b981";

/* ─── small helpers ──────────────────────────────────────────────────────────── */
const fmtINR    = (v) => `₹${Number(v ?? 0).toLocaleString("en-IN")}`;
const fmtPct    = (v) => `${v > 0 ? "+" : ""}${v}%`;
const shortDate = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/* ─── demo data (shown when there are no real orders yet) ───────────────────── */
const buildDemoData = () => {
    const dailyRevenue = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        d.setHours(0, 0, 0, 0);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const base = isWeekend ? 5200 : 3400;
        const jitter = Math.floor(Math.sin(i * 2.3) * 1200 + Math.cos(i * 1.7) * 800);
        return {
            date:    d.toISOString(),
            orders:  isWeekend ? 28 + (i % 7) : 18 + (i % 5),
            revenue: Math.max(1800, base + jitter),
        };
    });

    const weeklyRevenue = Array.from({ length: 8 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 7 * (7 - i));
        d.setHours(0, 0, 0, 0);
        return {
            weekStart: d.toISOString(),
            orders:  120 + i * 8 + (i % 3) * 12,
            revenue: 18000 + i * 2200 + (i % 2) * 3000,
        };
    });

    return {
        kpi: {
            totalRevenue:     127430,
            revenueThisMonth:  18640,
            revenueLastMonth:  15200,
            revenueGrowth:      22.6,
            totalOrders:         716,
            ordersThisWeek:       47,
            ordersPrevWeek:       39,
            ordersGrowth:        20.5,
            avgOrderValue:        178,
            conversionRate:      82.4,
            totalBookings:        94,
        },
        charts: {
            dailyRevenue,
            weeklyRevenue,
            mostOrderedItems: [
                { name: "Classic Lassi",        category: "Lassi",    totalQuantity: 214, totalRevenue: 17120 },
                { name: "Mango Lassi",          category: "Lassi",    totalQuantity: 189, totalRevenue: 18900 },
                { name: "Paneer Butter Masala", category: "Mains",    totalQuantity: 142, totalRevenue: 28400 },
                { name: "Butter Naan",          category: "Breads",   totalQuantity: 138, totalRevenue:  8280 },
                { name: "Samosa (2 pcs)",       category: "Starters", totalQuantity: 121, totalRevenue:  7260 },
                { name: "Dal Makhani",          category: "Mains",    totalQuantity: 108, totalRevenue: 19440 },
                { name: "Strawberry Lassi",     category: "Lassi",    totalQuantity:  97, totalRevenue:  9700 },
                { name: "Chilli Paneer",        category: "Starters", totalQuantity:  84, totalRevenue: 16800 },
            ],
            ordersByStatus: {
                completed:        591,
                preparing:         52,
                out_for_delivery:  38,
                pending:           24,
                cancelled:         11,
            },
            peakHours: [
                { hour:  7, count: 12 }, { hour:  8, count: 18 }, { hour:  9, count: 14 },
                { hour: 10, count: 10 }, { hour: 11, count: 22 },
                { hour: 12, count: 48 }, { hour: 13, count: 62 }, { hour: 14, count: 45 },
                { hour: 15, count: 19 }, { hour: 16, count: 15 }, { hour: 17, count: 23 },
                { hour: 18, count: 38 }, { hour: 19, count: 71 }, { hour: 20, count: 84 },
                { hour: 21, count: 67 }, { hour: 22, count: 41 }, { hour: 23, count: 18 },
            ],
        },
    };
};

const GrowthPill = ({ value }) => {
    if (value === null || value === undefined) return null;
    const up = value >= 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
            up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
        }`}>
            {up ? <MdTrendingUp size={12} /> : <MdTrendingDown size={12} />}
            {fmtPct(value)}
        </span>
    );
};

/* ─── custom tooltip ────────────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 shadow-xl rounded-xl px-3 py-2.5 text-xs min-w-[120px]">
            <p className="font-semibold text-gray-700 mb-2 truncate">{label}</p>
            {payload.map((p) => (
                <div key={p.dataKey} className="flex justify-between gap-4 mb-0.5">
                    <span style={{ color: p.color }} className="capitalize">{p.name}</span>
                    <span className="font-semibold text-gray-800">
                        {p.dataKey === "revenue" ? fmtINR(p.value) : p.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

/* ─── tab button ─────────────────────────────────────────────────────────────── */
const Tab = ({ label, icon: Icon, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            active
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
        }`}
    >
        <Icon size={15} /> {label}
    </button>
);

/* ─── section card wrapper ───────────────────────────────────────────────────── */
const Card = ({ title, subtitle, children, delay = 0, className = "" }) => (
    <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3, ease: "easeOut" }}
        className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}
    >
        {title && (
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
                    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
            </div>
        )}
        {children}
    </motion.div>
);

/* ─── section: Revenue ─────────────────────────────────────────────────────── */
const RevenueSection = ({ charts }) => {
    const [period, setPeriod] = useState("daily");
    const daily  = charts.dailyRevenue  ?? [];
    const weekly = charts.weeklyRevenue ?? [];

    const data = period === "daily"
        ? daily.map(d => ({ label: shortDate(d.date),   orders: d.orders, revenue: d.revenue }))
        : weekly.map(d => ({ label: shortDate(d.weekStart), orders: d.orders, revenue: d.revenue }));

    const isEmpty = data.length === 0;

    return (
        <div className="space-y-6">
            {/* Period toggle */}
            <div className="flex gap-2">
                {["daily", "weekly"].map(p => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            period === p
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                    >
                        {p === "daily" ? "Daily (30d)" : "Weekly (8w)"}
                    </button>
                ))}
            </div>

            {/* Revenue Area chart */}
            <Card title="Revenue Trend" subtitle={period === "daily" ? "Last 30 days" : "Last 8 weeks"} delay={0.05}>
                {isEmpty ? (
                    <p className="text-center text-gray-300 text-sm py-16">No revenue data yet</p>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="10%"  stopColor={CHART_ORANGE} stopOpacity={0.25} />
                                    <stop offset="95%"  stopColor={CHART_ORANGE} stopOpacity={0}    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area
                                type="monotone" dataKey="revenue" name="Revenue"
                                stroke={CHART_ORANGE} strokeWidth={2.5}
                                fill="url(#revenueGrad)" dot={false}
                                activeDot={{ r: 5, fill: CHART_ORANGE }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </Card>

            {/* Orders & Revenue dual-bar */}
            <Card title="Orders vs Revenue" subtitle="Bars side by side" delay={0.1}>
                {isEmpty ? (
                    <p className="text-center text-gray-300 text-sm py-16">No data yet</p>
                ) : (
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={data} barGap={3} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                            <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                            <Bar yAxisId="left"  dataKey="orders"  name="Orders"  fill={CHART_ORANGE} radius={[4, 4, 0, 0]} maxBarSize={28} />
                            <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill={CHART_AMBER}  radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </Card>
        </div>
    );
};

/* ─── section: Dishes ──────────────────────────────────────────────────────── */
const DishesSection = ({ items = [] }) => {
    const maxQty = items[0]?.totalQuantity ?? 1;
    return (
        <div className="space-y-6">
            {/* Animated progress list */}
            <Card title="Top Dishes by Quantity" subtitle="All-time, non-cancelled orders" delay={0.05}>
                {items.length === 0 ? (
                    <p className="text-center text-gray-300 text-sm py-10">No data yet</p>
                ) : (
                    <div className="space-y-4">
                        {items.map((item, i) => (
                            <div key={item._id ?? i} className="flex items-center gap-3">
                                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
                                    ${i === 0 ? "bg-orange-500 text-white" : i === 1 ? "bg-amber-400 text-white" : i === 2 ? "bg-yellow-300 text-gray-800" : "bg-gray-100 text-gray-500"}`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{item.totalQuantity}×</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(item.totalQuantity / maxQty) * 100}%` }}
                                            transition={{ delay: 0.15 + i * 0.06, duration: 0.55, ease: "easeOut" }}
                                            className="h-2 rounded-full"
                                            style={{ background: i === 0 ? CHART_ORANGE : i === 1 ? CHART_AMBER : CHART_BLUE }}
                                        />
                                    </div>
                                    {item.category && (
                                        <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                                    )}
                                </div>
                                <p className="text-xs font-semibold text-gray-700 flex-shrink-0 w-20 text-right">
                                    {fmtINR(item.totalRevenue)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Horizontal bar chart */}
            {items.length > 0 && (
                <Card title="Dish Revenue Breakdown" subtitle="Top 8 items" delay={0.15}>
                    <ResponsiveContainer width="100%" height={items.length * 40 + 20}>
                        <BarChart
                            data={items.map(it => ({ name: it.name.length > 20 ? it.name.slice(0, 18) + "…" : it.name, revenue: it.totalRevenue, qty: it.totalQuantity }))}
                            layout="vertical"
                            margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} tickLine={false} axisLine={false} width={110} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="revenue" name="Revenue" fill={CHART_ORANGE} radius={[0, 4, 4, 0]} maxBarSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}
        </div>
    );
};

/* ─── section: Orders ──────────────────────────────────────────────────────── */
const OrdersSection = ({ charts, kpi }) => {
    const statusMap  = charts.ordersByStatus ?? {};
    const peakHours  = charts.peakHours      ?? [];
    const total      = Object.values(statusMap).reduce((s, c) => s + c, 0);

    const pieData = Object.entries(statusMap).map(([status, count]) => ({
        name: status.replace(/_/g, " "),
        value: count,
        fill: STATUS_COLORS[status] ?? "#94a3b8",
    }));

    const hoursData = Array.from({ length: 24 }, (_, h) => ({
        hour: `${String(h).padStart(2, "0")}:00`,
        orders: peakHours.find(p => p.hour === h)?.count ?? 0,
    }));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status donut */}
                <Card title="Order Status Breakdown" subtitle={`${total} total orders`} delay={0.05}>
                    {pieData.length === 0 ? (
                        <p className="text-center text-gray-300 text-sm py-10">No data yet</p>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%" cy="50%"
                                        innerRadius={55} outerRadius={90}
                                        paddingAngle={3}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {pieData.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val) => [`${val} orders`, ""]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-2">
                                {Object.entries(statusMap).map(([status, count]) => {
                                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                                    return (
                                        <div key={status} className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[status] ?? "#94a3b8" }} />
                                            <StatusBadge status={status} />
                                            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                                                    className="h-1.5 rounded-full"
                                                    style={{ background: STATUS_COLORS[status] ?? "#94a3b8" }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 w-16 text-right">{count} ({pct}%)</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </Card>

                {/* Conversion rate gauge + funnel */}
                <Card title="Order Conversion Rate" subtitle="Completed ÷ all orders placed" delay={0.1}>
                    <div className="flex flex-col items-center justify-center py-4">
                        {/* Circular gauge via SVG */}
                        <ConversionGauge value={kpi.conversionRate} />
                        <p className="text-3xl font-bold text-gray-900 -mt-2">{kpi.conversionRate}%</p>
                        <p className="text-xs text-gray-400 mt-1">Conversion rate</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50 rounded-xl p-3 text-center">
                            <p className="text-emerald-700 font-bold text-lg">{statusMap.completed ?? 0}</p>
                            <p className="text-xs text-emerald-600">Completed</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-3 text-center">
                            <p className="text-red-600 font-bold text-lg">{statusMap.cancelled ?? 0}</p>
                            <p className="text-xs text-red-500">Cancelled</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Peak hours */}
            <Card title="Peak Order Hours" subtitle="Last 30 days, by hour of day (UTC)" delay={0.15}>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={hoursData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval={2} />
                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="orders" name="Orders" radius={[3, 3, 0, 0]} maxBarSize={18}>
                            {hoursData.map((entry, i) => (
                                <Cell
                                    key={i}
                                    fill={entry.orders === Math.max(...hoursData.map(h => h.orders)) && entry.orders > 0
                                        ? CHART_ORANGE : "#fed7aa"}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

/* ─── SVG conversion gauge ───────────────────────────────────────────────────── */
const ConversionGauge = ({ value = 0 }) => {
    const R = 54, CX = 64, CY = 64;
    const circ = 2 * Math.PI * R;
    const clamp = Math.max(0, Math.min(100, value));
    const dash  = (clamp / 100) * circ;
    const color = clamp >= 70 ? CHART_GREEN : clamp >= 40 ? CHART_AMBER : "#ef4444";
    return (
        <svg width="128" height="80" viewBox="0 0 128 80">
            {/* Track */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f3f4f6" strokeWidth="10"
                strokeDasharray={circ / 2} strokeDashoffset={-(circ / 4)}
                strokeLinecap="round" transform="rotate(180 64 64)" />
            {/* Fill - semicircle gauge (bottom half hidden) */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke={color} strokeWidth="10"
                strokeDasharray={`${(clamp / 100) * (circ / 2)} ${circ}`}
                strokeDashoffset={circ / 4}
                strokeLinecap="round" transform="rotate(-90 64 64)"
                style={{ transition: "stroke-dasharray 0.7s ease" }}
            />
        </svg>
    );
};

/* ─── Skeleton loader ───────────────────────────────────────────────────────── */
const Skeleton = ({ className = "" }) => (
    <div className={`bg-gray-100 animate-pulse rounded-xl ${className}`} />
);

/* ─── Main page ─────────────────────────────────────────────────────────────── */
const TABS = [
    { key: "revenue",    label: "Revenue",    icon: MdAttachMoney   },
    { key: "dishes",     label: "Dishes",     icon: MdBarChart      },
    { key: "orders",     label: "Orders",     icon: MdPieChart      },
];

const OwnerAnalytics = () => {
    const { restaurant, loading: restLoading } = useOwnerRestaurant();
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab,     setTab]     = useState("revenue");

    const load = useCallback(() => {
        if (!restaurant?._id) { setLoading(false); return; }
        setLoading(true);
        fetchAnalytics(restaurant._id)
            .then(({ data: d }) => setData(d.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [restaurant]);

    useEffect(() => { load(); }, [load]);

    /* ── Loading skeleton ── */
    if (restLoading || loading) {
        return (
            <div className="space-y-6">
                <div className="h-10 w-48 bg-gray-100 animate-pulse rounded-xl" />
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
                <Skeleton className="h-80" />
            </div>
        );
    }

    /* ── No restaurant ── */
    if (!restaurant) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <MdBarChart className="text-gray-200" size={72} />
                <p className="text-gray-400 text-sm">No restaurant found — create one first.</p>
            </div>
        );
    }

    const isDemo   = !data || (data.kpi?.totalOrders ?? 0) === 0;
    const display  = isDemo ? buildDemoData() : data;
    const kpi      = display.kpi;
    const charts   = display.charts;

    return (
        <div className="space-y-8">
            <PageHeader
                title="Analytics"
                description={`Insights for ${restaurant.name}`}
                action={
                    <button
                        onClick={load}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors shadow-sm"
                    >
                        <MdRefresh size={16} /> Refresh
                    </button>
                }
            />

            {/* Demo data notice */}
            {isDemo && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700">
                    📊 Demo Data — No real orders yet
                </div>
            )}

            {/* ── 6 KPI cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                    icon={MdAttachMoney} label="All-Time Revenue"
                    value={fmtINR(kpi.totalRevenue)} color="green" delay={0}
                />
                <StatCard
                    icon={MdTrendingUp} label="This Month"
                    value={fmtINR(kpi.revenueThisMonth)}
                    sub={kpi.revenueGrowth !== null ? (
                        <GrowthPill value={kpi.revenueGrowth} />
                    ) : "vs last month"}
                    color="orange" delay={0.04}
                />
                <StatCard
                    icon={MdShoppingBag} label="Total Orders"
                    value={kpi.totalOrders ?? 0} color="blue" delay={0.08}
                />
                <StatCard
                    icon={MdOutlineShoppingCart} label="This Week"
                    value={kpi.ordersThisWeek ?? 0}
                    sub={kpi.ordersGrowth !== null ? (
                        <GrowthPill value={kpi.ordersGrowth} />
                    ) : "vs last week"}
                    color="blue" delay={0.12}
                />
                <StatCard
                    icon={MdCheckCircle} label="Avg Order"
                    value={fmtINR(kpi.avgOrderValue)} color="purple" delay={0.16}
                />
                <StatCard
                    icon={MdEventSeat} label="Bookings"
                    value={kpi.totalBookings ?? 0} color="purple" delay={0.2}
                />
            </div>

            {/* Conversion rate highlight banner */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className={`flex items-center justify-between px-5 py-4 rounded-2xl border ${
                    kpi.conversionRate >= 70
                        ? "bg-emerald-50 border-emerald-200"
                        : kpi.conversionRate >= 40
                        ? "bg-amber-50 border-amber-200"
                        : "bg-red-50 border-red-200"
                }`}
            >
                <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${
                        kpi.conversionRate >= 70 ? "text-emerald-700"
                        : kpi.conversionRate >= 40 ? "text-amber-700" : "text-red-600"
                    }`}>Order Conversion Rate</p>
                    <p className="text-3xl font-extrabold text-gray-900 mt-0.5">{kpi.conversionRate ?? 0}%</p>
                    <p className="text-xs text-gray-500 mt-1">
                        {kpi.conversionRate >= 70
                            ? "Excellent — customers reliably complete orders."
                            : kpi.conversionRate >= 40
                            ? "Room to improve — review cancellation reasons."
                            : "Needs attention — high cancellation rate detected."}
                    </p>
                </div>
                <MdCheckCircle
                    size={52}
                    className={kpi.conversionRate >= 70 ? "text-emerald-300" : kpi.conversionRate >= 40 ? "text-amber-300" : "text-red-300"}
                />
            </motion.div>

            {/* ── Tab navigation ── */}
            <div className="flex flex-wrap gap-2">
                {TABS.map(t => (
                    <Tab
                        key={t.key}
                        label={t.label}
                        icon={t.icon}
                        active={tab === t.key}
                        onClick={() => setTab(t.key)}
                    />
                ))}
            </div>

            {/* ── Tab content ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                >
                    {tab === "revenue" && <RevenueSection charts={charts} />}
                    {tab === "dishes"  && <DishesSection  items={charts.mostOrderedItems ?? []} />}
                    {tab === "orders"  && <OrdersSection  charts={charts} kpi={kpi} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default OwnerAnalytics;
