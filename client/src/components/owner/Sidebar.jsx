import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    MdDashboard,
    MdRestaurantMenu,
    MdShoppingBag,
    MdEventSeat,
    MdBarChart,
    MdLogout,
    MdMenu,
    MdClose,
    MdStorefront
} from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { useOwnerRestaurant } from "../../context/OwnerRestaurantContext";

const NAV_ITEMS = [
    { to: "/owner/dashboard", icon: MdDashboard,      label: "Overview"  },
    { to: "/owner/orders",    icon: MdShoppingBag,     label: "Orders"    },
    { to: "/owner/menu",      icon: MdRestaurantMenu,  label: "Menu"      },
    { to: "/owner/bookings",  icon: MdEventSeat,       label: "Bookings"  },
    { to: "/owner/analytics", icon: MdBarChart,        label: "Analytics" },
];

const Sidebar = ({ collapsed, onToggle }) => {
    const { user, logout } = useAuth();
    const { restaurant } = useOwnerRestaurant();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/owner/login");
    };

    return (
        <motion.aside
            animate={{ width: collapsed ? 72 : 240 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="h-screen bg-gray-950 flex flex-col border-r border-gray-800 overflow-hidden flex-shrink-0 z-30"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800 min-h-[65px]">
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-2 overflow-hidden"
                        >
                            <span className="text-orange-400 text-xl font-extrabold tracking-tight whitespace-nowrap">
                                Lassi Wassi
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
                <button
                    onClick={onToggle}
                    className="text-gray-400 hover:text-white transition-colors ml-auto flex-shrink-0"
                    aria-label="Toggle sidebar"
                >
                    {collapsed ? <MdMenu size={22} /> : <MdClose size={22} />}
                </button>
            </div>

            {/* Restaurant badge */}
            <AnimatePresence>
                {!collapsed && restaurant && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mx-3 mt-4 mb-1 px-3 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-2"
                    >
                        <MdStorefront className="text-orange-400 flex-shrink-0" size={16} />
                        <span className="text-orange-300 text-xs font-medium truncate">{restaurant.name}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Nav */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                                isActive
                                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                            }`
                        }
                    >
                        <Icon size={20} className="flex-shrink-0" />
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -6 }}
                                    transition={{ duration: 0.12 }}
                                    className="text-sm font-medium whitespace-nowrap"
                                >
                                    {label}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-800 px-2 py-4 space-y-1">
                {/* User avatar */}
                <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? "justify-center" : ""}`}>
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                        {user?.name?.[0]?.toUpperCase() ?? "O"}
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <p className="text-white text-xs font-semibold truncate max-w-[130px]">{user?.name}</p>
                                <p className="text-gray-500 text-[11px] truncate max-w-[130px]">{user?.email}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
                >
                    <MdLogout size={20} className="flex-shrink-0" />
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-sm font-medium whitespace-nowrap"
                            >
                                Logout
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
