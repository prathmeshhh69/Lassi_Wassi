import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "../../components/layout/AuthLayout";
import { FiEye, FiEyeOff, FiUser, FiBriefcase } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

/* The two login modes */
const MODES = [
    { key: "customer", label: "Customer",     icon: FiUser,      accent: "orange" },
    { key: "owner",    label: "Owner / Admin", icon: FiBriefcase, accent: "gray"   },
];

const Login = () => {
    const { login, ownerLogin } = useAuth();
    const navigate              = useNavigate();
    const [searchParams]        = useSearchParams();

    /* Initialise mode from ?mode=owner query param so /owner/login redirect works */
    const [mode, setMode]             = useState(
        searchParams.get("mode") === "owner" ? "owner" : "customer"
    );
    const [formData, setFormData]     = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError]           = useState("");
    const [isLoading, setIsLoading]   = useState(false);

    /* Re-sync if URL param changes (e.g. back/forward nav) */
    useEffect(() => {
        const param = searchParams.get("mode");
        if (param === "owner") setMode("owner");
    }, [searchParams]);

    const switchMode = (next) => {
        setMode(next);
        setError("");
    };

    const handleChange = (e) => {
        setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));
        if (error) setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const authFn = mode === "owner" ? ownerLogin : login;
            const data   = await authFn({ email: formData.email, password: formData.password });
            const role   = data?.data?.role;

            /* Role-aware redirect */
            if (role === "owner" || role === "admin") {
                navigate("/owner/dashboard");
            } else {
                navigate("/");
            }
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                (mode === "owner"
                    ? "Access denied — please use an owner or admin account."
                    : "Invalid email or password. Please try again.")
            );
        } finally {
            setIsLoading(false);
        }
    };

    const isOwner = mode === "owner";

    return (
        <AuthLayout>
            {/* ── Header ── */}
            <div className="text-center mb-7">
                <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
                <p className="mt-1.5 text-gray-500 text-sm">Sign in to your Lassi Wassi account</p>
            </div>

            {/* ── Mode toggle ── */}
            <div className="relative flex bg-gray-100 rounded-xl p-1 mb-7 select-none">
                {MODES.map((m) => (
                    <button
                        key={m.key}
                        type="button"
                        onClick={() => switchMode(m.key)}
                        className="relative flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold z-10 transition-colors duration-200"
                        style={{ color: mode === m.key ? (isOwner ? "#1f2937" : "#f97316") : "#9ca3af" }}
                    >
                        <m.icon size={14} />
                        {m.label}
                    </button>
                ))}

                {/* Animated pill indicator */}
                <motion.div
                    className="absolute inset-y-1 rounded-lg bg-white shadow-sm pointer-events-none"
                    style={{ width: "calc(50% - 4px)" }}
                    animate={{ x: isOwner ? "calc(100% + 4px)" : 4 }}
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
            </div>

            {/* ── Role tag line ── */}
            <AnimatePresence mode="wait">
                <motion.p
                    key={mode}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.18 }}
                    className="text-center text-xs text-gray-400 -mt-4 mb-5"
                >
                    {isOwner
                        ? "🏪 Restricted to registered restaurant owners and admins"
                        : "🛒 Order food, book tables, track deliveries"}
                </motion.p>
            </AnimatePresence>

            {/* ── Error banner ── */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        key="err"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-5 px-4 py-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                        placeholder={isOwner ? "owner@restaurant.com" : "you@example.com"}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 pr-12 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                    </div>
                    {!isOwner && (
                        <div className="flex justify-end mt-1">
                            <a
                                href="/forgot-password"
                                className="text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors"
                            >
                                Forgot password?
                            </a>
                        </div>
                    )}
                </div>

                {/* ── Submit ── */}
                <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 rounded-xl font-semibold text-white shadow-md transition-all duration-200 flex items-center justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                        isOwner
                            ? "bg-gray-800 hover:bg-gray-900 shadow-gray-200"
                            : "bg-orange-500 hover:bg-orange-600 shadow-orange-200"
                    }`}
                >
                    {isLoading ? (
                        <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : isOwner ? (
                        "Sign In as Owner"
                    ) : (
                        "Log In"
                    )}
                </motion.button>
            </form>

            {/* Sign-up link — only shown for customer mode */}
            <AnimatePresence>
                {!isOwner && (
                    <motion.p
                        key="signup-link"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-6 text-center text-sm text-gray-500"
                    >
                        Don&apos;t have an account?{" "}
                        <Link
                            to="/signup"
                            className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                        >
                            Create one
                        </Link>
                    </motion.p>
                )}
            </AnimatePresence>
        </AuthLayout>
    );
};

export default Login;
