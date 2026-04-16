import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "../components/Layout.jsx";
import SectionTitle from "../components/ui/SectionTitle.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx";
import Badge from "../components/ui/Badge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const AVATAR_COLORS = [
  "from-orange-400 to-amber-300",
  "from-purple-400 to-pink-300",
  "from-emerald-400 to-teal-300",
  "from-blue-400 to-indigo-300",
];

function AvatarInitial({ name = "U", index = 0 }) {
  const gradients = AVATAR_COLORS;
  return (
    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center text-3xl font-extrabold text-white shadow-md select-none`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();

  const [form, setForm]       = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");
  const [stats, setStats]     = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name ?? "", email: user.email ?? "", phone: user.phone ?? "" });
    }
  }, [user]);

  useEffect(() => {
    // fetch order/booking summary for the user
    Promise.all([
      api.get("/api/orders/me", { params: { limit: 1 } }),
      api.get("/api/bookings/me", { params: { limit: 1 } }),
    ])
      .then(([oRes, bRes]) => {
        setStats({
          totalOrders:   oRes.data.total   ?? oRes.data.data?.length ?? 0,
          totalBookings: bRes.data.total   ?? bRes.data.data?.length ?? 0,
        });
      })
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.patch("/api/auth/me", { name: form.name, phone: form.phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) return <Layout><EmptyState icon="🔒" title="Please log in" action={{ label: "Log In", onClick: () => navigate("/login") }} /></Layout>;

  return (
    <Layout pageKey="profile">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <SectionTitle title="My Profile" size="lg" className="mb-8" />

        {/* Avatar + name card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-6 flex flex-col sm:flex-row items-center gap-6"
        >
          <AvatarInitial name={user.name} index={0} />
          <div>
            <p className="text-xl font-extrabold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
            <Badge variant={user.role === "owner" ? "info" : "neutral"} className="mt-2">
              {user.role === "owner" ? "Restaurant Owner" : user.role === "admin" ? "Admin" : "Customer"}
            </Badge>
          </div>
        </motion.div>

        {/* Stats row */}
        {!statsLoading && stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="grid grid-cols-2 gap-4 mb-6"
          >
            <Link to="/orders" className="bg-orange-50 hover:bg-orange-100 transition-colors rounded-2xl p-5 text-center">
              <p className="text-3xl font-extrabold text-orange-600">{stats.totalOrders}</p>
              <p className="text-xs text-orange-500 font-medium mt-1">Total Orders</p>
            </Link>
            <div className="bg-purple-50 rounded-2xl p-5 text-center">
              <p className="text-3xl font-extrabold text-purple-600">{stats.totalBookings}</p>
              <p className="text-xs text-purple-500 font-medium mt-1">Table Bookings</p>
            </div>
          </motion.div>
        )}
        {statsLoading && <div className="h-28 rounded-2xl bg-gray-100 animate-pulse mb-6" />}

        {/* Edit form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
        >
          <h3 className="font-bold text-gray-800 mb-4">Edit Details</h3>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-red-600 text-sm mb-4">{error}</div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name</label>
              <input
                type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
              <input
                type="email" value={form.email} disabled
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone (optional)</label>
              <input
                type="tel" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 XXXXX XXXXX"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>

          <Button
            full size="md" className="mt-4"
            onClick={handleSave}
            loading={saving}
            variant={saved ? "secondary" : "primary"}
          >
            {saved ? "✓ Saved!" : "Save Changes"}
          </Button>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 mb-6"
        >
          {[
            { label: "My Orders", icon: "📦", to: "/orders" },
            { label: "My Bookings", icon: "🍽️", to: "/bookings/me" },
            { label: "Contact Support", icon: "💬", to: "/contact" },
          ].map(link => (
            <Link key={link.to} to={link.to} className="flex items-center gap-3 px-5 py-4 hover:bg-orange-50 transition-colors">
              <span className="text-xl">{link.icon}</span>
              <span className="text-sm font-medium text-gray-700">{link.label}</span>
              <span className="ml-auto text-gray-300">›</span>
            </Link>
          ))}
        </motion.div>

        {user.role === "owner" && (
          <Button
            full variant="outline" size="md" className="mb-3"
            onClick={() => navigate("/owner/dashboard")}
          >
            Go to Owner Dashboard
          </Button>
        )}

        <Button full variant="danger" size="md" onClick={handleLogout}>
          Log Out
        </Button>
      </div>
    </Layout>
  );
}
