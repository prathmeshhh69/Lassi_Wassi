import { motion } from "framer-motion";

/**
 * StatCard — premium KPI card for the dashboard
 * Props: icon, label, value, sub, color ("orange"|"blue"|"green"|"purple")
 */
const COLORS = {
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    blue:   "bg-blue-50   text-blue-600   border-blue-100",
    green:  "bg-emerald-50 text-emerald-600 border-emerald-100",
    purple: "bg-purple-50 text-purple-600  border-purple-100",
};

const StatCard = ({ icon: Icon, label, value, sub, color = "orange", delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
            </div>
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center border ${COLORS[color]}`}>
                <Icon size={20} />
            </span>
        </div>
    </motion.div>
);

export default StatCard;
