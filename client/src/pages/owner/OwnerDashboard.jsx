import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    MdAttachMoney, MdShoppingBag, MdEventSeat, MdTrendingUp,
    MdOutlineLocalFireDepartment, MdArrowForward, MdStore, MdRefresh,
} from "react-icons/md";
import StatusBadge from "../../components/owner/StatusBadge";
import { useOwnerRestaurant } from "../../context/OwnerRestaurantContext";
import api from "../../services/api";

const DEMO_ORDERS = [
    { _id: "d1", user: { name: "Arjun Mehta" },     items: [{ name: "Chicken Shawarma" }, { name: "Mango Lassi" }],      totalAmount: 180, status: "completed",        createdAt: new Date(Date.now() - 12 * 60000) },
    { _id: "d2", user: { name: "Sneha Kulkarni" },   items: [{ name: "Oreo Thick Shake" }, { name: "Veg Shawarma" }],     totalAmount: 220, status: "preparing",         createdAt: new Date(Date.now() - 6  * 60000) },
    { _id: "d3", user: { name: "Rahul Sharma" },     items: [{ name: "Cold Coffee" }, { name: "Blue Island Mojito" }],    totalAmount: 200, status: "pending",           createdAt: new Date(Date.now() - 3  * 60000) },
    { _id: "d4", user: { name: "Priya Desai" },      items: [{ name: "Death By Chocolate" }, { name: "Rose Lassi" }],     totalAmount: 205, status: "completed",         createdAt: new Date(Date.now() - 25 * 60000) },
    { _id: "d5", user: { name: "Vikram Joshi" },     items: [{ name: "Nutella Thick Shake" }],                            totalAmount: 160, status: "out_for_delivery",  createdAt: new Date(Date.now() - 9  * 60000) },
    { _id: "d6", user: { name: "Ananya Patil" },     items: [{ name: "Paneer Shawarma" }, { name: "Strawberry Lassi" }],  totalAmount: 195, status: "completed",         createdAt: new Date(Date.now() - 35 * 60000) },
];

const DEMO_TOP = [
    { name: "Chicken Shawarma",   orders: 48, emoji: "🌯" },
    { name: "Mango Lassi",        orders: 41, emoji: "🥛" },
    { name: "Oreo Thick Shake",   orders: 37, emoji: "🥤" },
    { name: "Cold Coffee",        orders: 34, emoji: "☕" },
    { name: "Blue Island Mojito", orders: 29, emoji: "🍹" },
];

const DEMO_STATS = { todayOrders: 24, todayRevenue: 4680, activeOrders: 3, tableBookings: 7 };

const STATUS_CFG = {
    pending:          { dot: "bg-amber-400",   label: "Pending"     },
    preparing:        { dot: "bg-blue-400",    label: "Preparing"   },
    out_for_delivery: { dot: "bg-purple-400",  label: "On the way"  },
    completed:        { dot: "bg-emerald-400", label: "Delivered"   },
    cancelled:        { dot: "bg-red-400",     label: "Cancelled"   },
};

const timeAgo = (date) => {
    const m = Math.floor((Date.now() - new Date(date)) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
};

const KpiCard = ({ icon: Icon, label, value, sub, color, delay, trend }) => {
    const ring = { orange:"border-orange-100", green:"border-emerald-100", blue:"border-blue-100", purple:"border-purple-100" };
    const bg   = { orange:"bg-orange-50",      green:"bg-emerald-50",      blue:"bg-blue-50",      purple:"bg-purple-50"      };
    const ic   = { orange:"bg-orange-100 text-orange-600", green:"bg-emerald-100 text-emerald-600", blue:"bg-blue-100 text-blue-600", purple:"bg-purple-100 text-purple-600" };
    return (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:0.4 }}
            className={`${bg[color]} border ${ring[color]} rounded-2xl p-5`}>
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${ic[color]}`}><Icon size={20} /></div>
                {trend !== undefined && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                        {trend >= 0 ? "+" : ""}{trend}%
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{value}</p>
            <p className="text-xs font-medium text-gray-500">{label}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        </motion.div>
    );
};

const LiveRow = ({ order, index }) => {
    const s = STATUS_CFG[order.status] ?? STATUS_CFG.pending;
    return (
        <motion.div initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.3 + index * 0.06 }}
            className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{order.user?.name ?? "Guest"}</p>
                <p className="text-xs text-gray-400 truncate">{order.items?.map((i) => i.name).join(", ")}</p>
            </div>
            <div className="text-right flex-shrink-0 mr-2">
                <p className="text-sm font-bold text-gray-900">&#8377;{order.totalAmount}</p>
                <p className="text-[11px] text-gray-400">{timeAgo(order.createdAt)}</p>
            </div>
            <StatusBadge status={order.status} />
        </motion.div>
    );
};

const OverviewDashboard = () => {
    const { restaurant, loading: restLoading } = useOwnerRestaurant();
    const [orders, setOrders]       = useState([]);
    const [stats, setStats]         = useState(null);
    const [loading, setLoading]     = useState(true);
    const [isDemo, setIsDemo]       = useState(false);
    const [refreshed, setRefreshed] = useState(new Date());

    const load = async () => {
        if (!restaurant?._id) { setLoading(false); setIsDemo(true); setOrders(DEMO_ORDERS); setStats(DEMO_STATS); return; }
        setLoading(true);
        try {
            const today = new Date(); today.setHours(0,0,0,0);
            const [ordRes, analyticsRes] = await Promise.all([
                api.get(`/api/owner/restaurants/${restaurant._id}/orders`, { params: { limit: 20 } }),
                api.get(`/api/owner/restaurants/${restaurant._id}/analytics`),
            ]);
            const all     = ordRes.data?.data ?? [];
            const todayList = all.filter((o) => new Date(o.createdAt) >= today);
            const a       = analyticsRes.data?.data ?? {};
            const noData  = todayList.length === 0 && !a.totalOrders;
            setIsDemo(noData);
            setOrders(noData ? DEMO_ORDERS : todayList.length > 0 ? todayList : DEMO_ORDERS);
            setStats({
                todayOrders:   noData ? DEMO_STATS.todayOrders   : todayList.length,
                todayRevenue:  noData ? DEMO_STATS.todayRevenue  : todayList.reduce((s,o) => s+(o.totalAmount||0),0),
                activeOrders:  noData ? DEMO_STATS.activeOrders  : todayList.filter((o) => ["pending","preparing","out_for_delivery"].includes(o.status)).length,
                tableBookings: noData ? DEMO_STATS.tableBookings : (a.totalBookings ?? 0),
            });
        } catch {
            setIsDemo(true); setOrders(DEMO_ORDERS); setStats(DEMO_STATS);
        } finally {
            setLoading(false); setRefreshed(new Date());
        }
    };

    useEffect(() => { load(); }, [restaurant]);

    if (restLoading || loading)
        return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" /></div>;

    const s = stats ?? DEMO_STATS;
    const now = new Date();
    const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
    const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
                className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <MdStore className="text-orange-500" size={20} />
                        <h1 className="text-xl font-bold text-gray-900">
                            {greeting}, {restaurant?.name ?? "Lassi Wassi"} 👋
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500">{dateStr} &middot; {now.toLocaleTimeString("en-IN",{ hour:"2-digit", minute:"2-digit" })}</p>
                </div>
                <div className="flex items-center gap-2">
                    {isDemo && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">📊 Demo Data</span>}
                    <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors">
                        <MdRefresh size={14}/> Refresh
                    </button>
                </div>
            </motion.div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={MdShoppingBag}              label="Today's Orders"   value={s.todayOrders}                              sub="All order types"      color="orange" delay={0}    trend={12} />
                <KpiCard icon={MdAttachMoney}              label="Today's Revenue"  value={`₹${s.todayRevenue.toLocaleString("en-IN")}`} sub="Completed orders"     color="green"  delay={0.06} trend={8}  />
                <KpiCard icon={MdOutlineLocalFireDepartment} label="Active Now"     value={s.activeOrders}                             sub="Pending + preparing"  color="blue"   delay={0.12} />
                <KpiCard icon={MdEventSeat}                label="Table Bookings"   value={s.tableBookings}                            sub="Confirmed today"      color="purple" delay={0.18} trend={5}  />
            </div>

            {/* Orders + Top items */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.22 }}
                    className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <h3 className="text-sm font-semibold text-gray-800">Live Orders Today</h3>
                        </div>
                        <Link to="/owner/orders" className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">See all <MdArrowForward size={14}/></Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {orders.slice(0,6).map((o, i) => <LiveRow key={o._id} order={o} index={i} />)}
                    </div>
                    <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400">
                        Refreshed at {refreshed.toLocaleTimeString("en-IN",{ hour:"2-digit", minute:"2-digit", second:"2-digit" })}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28 }}
                    className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
                        <MdOutlineLocalFireDepartment className="text-orange-500" size={16}/>
                        <h3 className="text-sm font-semibold text-gray-800">Top Sellers Today</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        {DEMO_TOP.map((item, i) => {
                            const pct = Math.round((item.orders / DEMO_TOP[0].orders) * 100);
                            return (
                                <motion.div key={item.name} initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.35 + i * 0.06 }} className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">{item.emoji}</span>
                                        <p className="text-xs font-semibold text-gray-800 flex-1 truncate">{item.name}</p>
                                        <span className="text-xs font-bold text-gray-900">{item.orders}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 ml-6">
                                        <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ delay: 0.4+i*0.06, duration:0.7, ease:"easeOut" }}
                                            className="h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-500"/>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                    <div className="px-5 py-3 border-t border-gray-50">
                        <Link to="/owner/menu" className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">Manage menu <MdArrowForward size={14}/></Link>
                    </div>
                </motion.div>
            </div>

            {/* Status breakdown */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Order Status Breakdown — Today</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {Object.entries(STATUS_CFG).map(([status, cfg]) => {
                        const count = orders.filter((o) => o.status === status).length;
                        return (
                            <div key={status} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <div className={`w-3 h-3 rounded-full ${cfg.dot}`}/>
                                <p className="text-lg font-bold text-gray-900">{count}</p>
                                <p className="text-[11px] text-gray-500 font-medium text-center leading-tight">{cfg.label}</p>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Quick actions */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.42 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label:"Manage Orders",   to:"/owner/orders",    icon:MdShoppingBag,              color:"bg-orange-500 hover:bg-orange-600" },
                    { label:"Edit Menu",        to:"/owner/menu",      icon:MdStore,                    color:"bg-blue-500 hover:bg-blue-600"    },
                    { label:"View Bookings",    to:"/owner/bookings",  icon:MdEventSeat,                color:"bg-purple-500 hover:bg-purple-600" },
                    { label:"Analytics",        to:"/owner/analytics", icon:MdTrendingUp,               color:"bg-emerald-500 hover:bg-emerald-600" },
                ].map(({ label, to, icon: Icon, color }) => (
                    <Link key={to} to={to}
                        className={`${color} text-white rounded-2xl p-4 flex flex-col items-center gap-2 text-center transition-colors shadow-sm hover:shadow-md`}>
                        <Icon size={22}/>
                        <span className="text-xs font-semibold">{label}</span>
                    </Link>
                ))}
            </motion.div>
        </div>
    );
};

export default OverviewDashboard;
