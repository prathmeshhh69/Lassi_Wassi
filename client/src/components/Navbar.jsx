import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMoon, FiSun, FiUser, FiShoppingBag, FiLogOut } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const navLinks = [
  { label: "Home", href: "#" },
  { label: "Restaurants", href: "#restaurants" },
  { label: "Orders", href: "#orders" },
];

function Navbar({ isDark, onToggleTheme }) {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ensure dropdown is closed whenever the user signs out
  useEffect(() => {
    if (!user) setDropdownOpen(false);
  }, [user]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  const avatarLetter = user?.name?.charAt(0).toUpperCase() ?? "?";

  // ── Desktop dropdown (has its own ref for click-outside) ─────────────────────
  const desktopAuth = () => {
    if (!user) {
      return (
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-100 hover:border-primary/60 hover:text-primary transition-colors ease-soft-out"
        >
          <span>Login</span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <FiUser size={14} />
          </span>
        </Link>
      );
    }

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-100 hover:border-primary/60 hover:text-primary transition-colors ease-soft-out"
          aria-label="Account menu"
        >
          <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
            {avatarLetter}
          </span>
        </button>

        {/* Dropdown */}
        <div
          className={`absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg overflow-hidden z-50 transition-all duration-200 origin-top-right ${
            dropdownOpen
              ? "scale-100 opacity-100 pointer-events-auto"
              : "scale-95 opacity-0 pointer-events-none"
          }`}
        >
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500">Signed in as</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
          </div>

          <div className="py-1.5">
            <Link
              to="/profile"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FiUser size={15} className="text-slate-400" />
              Profile
            </Link>
            <Link
              to="/orders"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FiShoppingBag size={15} className="text-slate-400" />
              My Orders
            </Link>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 py-1.5">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <FiLogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Mobile inline auth (no dropdown — the mobile panel is already a drawer) ──
  const mobileAuth = () => {
    if (!user) {
      return (
        <Link
          to="/login"
          onClick={() => setMobileOpen(false)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 hover:border-primary/60 hover:text-primary transition-colors ease-soft-out"
        >
          <span>Login</span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <FiUser size={14} />
          </span>
        </Link>
      );
    }

    return (
      <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-1">
        <p className="px-1 text-xs text-slate-400 dark:text-slate-500 pb-1">
          Signed in as <span className="font-semibold text-slate-700 dark:text-slate-200">{user.name}</span>
        </p>
        <Link
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-2 py-2 text-sm text-slate-700 dark:text-slate-200 hover:text-primary transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <FiUser size={15} className="text-slate-400" />
          Profile
        </Link>
        <Link
          to="/orders"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-2 py-2 text-sm text-slate-700 dark:text-slate-200 hover:text-primary transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <FiShoppingBag size={15} className="text-slate-400" />
          My Orders
        </Link>
        <button
          onClick={() => { handleLogout(); setMobileOpen(false); }}
          className="flex w-full items-center gap-3 px-2 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <FiLogOut size={15} />
          Logout
        </button>
      </div>
    );
  };

  return (
    <header
      className={`sticky top-0 z-30 bg-white/95 dark:bg-slate-950/80 backdrop-blur border-b transition-colors duration-200 ${isScrolled
          ? "shadow-md border-slate-200 dark:border-slate-800"
          : "border-transparent"
        }`}
    >
      <nav className="container flex items-center justify-between py-3 md:py-4">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group select-none">
          {/* Cup icon */}
          <div className="relative h-10 w-10 flex-shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg shadow-orange-200 dark:shadow-orange-900/40 group-hover:scale-105 transition-transform duration-200" />
            <div className="relative h-full w-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-white drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {/* Cup body */}
                <path d="M6 3h12l-1.5 13a2 2 0 0 1-2 1.8H9.5a2 2 0 0 1-2-1.8L6 3Z" fill="white" fillOpacity="0.25" stroke="white" />
                {/* Straw */}
                <line x1="14.5" y1="3" x2="13" y2="10.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                {/* Froth / bubbles */}
                <circle cx="9.5" cy="5" r="0.8" fill="white" stroke="none" />
                <circle cx="12" cy="4.2" r="0.6" fill="white" stroke="none" />
                <circle cx="11" cy="6" r="0.5" fill="white" stroke="none" />
              </svg>
            </div>
          </div>

          {/* Brand name */}
          <div className="flex flex-col leading-none gap-0.5">
            <span className="font-extrabold text-[1.15rem] tracking-tight bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
              Lassi Wassi
            </span>
            <span className="text-[0.65rem] font-medium tracking-widest uppercase text-slate-400 dark:text-slate-500 pl-0.5">
              Fresh · Fast · Local
            </span>
          </div>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          <div className="flex items-center gap-4 lg:gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="relative inline-flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ring-1 ring-slate-200 dark:ring-slate-800"
            aria-label="Toggle theme"
            type="button"
          >
            {isDark ? (
              <FiSun className="h-5 w-5 text-amber-400" />
            ) : (
              <FiMoon className="h-5 w-5 text-slate-800" />
            )}
          </button>

          {/* Cart */}
          <Link to="/cart" className="relative inline-flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ring-1 ring-slate-200 dark:ring-slate-800">
            <FiShoppingBag className="h-5 w-5 text-slate-800 dark:text-slate-100" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] px-1 rounded-full bg-primary text-white text-[0.65rem] font-semibold leading-4 text-center">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          {/* Auth (desktop) */}
          {desktopAuth()}
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-3 md:hidden">
          {/* Theme toggle (mobile) */}
          <button
            onClick={onToggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ring-1 ring-slate-200 dark:ring-slate-800"
            aria-label="Toggle theme"
            type="button"
          >
            {isDark ? (
              <FiSun className="h-5 w-5 text-amber-400" />
            ) : (
              <FiMoon className="h-5 w-5 text-slate-800 dark:text-slate-100" />
            )}
          </button>

          {/* Cart (mobile) */}
          <Link to="/cart" className="relative inline-flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ring-1 ring-slate-200 dark:ring-slate-800">
            <FiShoppingBag className="h-5 w-5 text-slate-800 dark:text-slate-100" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] px-1 rounded-full bg-primary text-white text-[0.6rem] font-semibold leading-4 text-center">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ring-1 ring-slate-200 dark:ring-slate-800"
            aria-label="Toggle navigation"
          >
            <span className="sr-only">Open menu</span>
            <div className="space-y-1.5">
              <span
                className={`block h-0.5 w-5 rounded-full bg-slate-800 dark:bg-slate-100 transition-transform duration-200 ${mobileOpen ? "translate-y-[5px] rotate-45" : ""
                  }`}
              />
              <span
                className={`block h-0.5 w-4 rounded-full bg-slate-800 dark:bg-slate-100 transition-opacity duration-150 ${mobileOpen ? "opacity-0" : "opacity-100"
                  }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-slate-800 dark:bg-slate-100 transition-transform duration-200 ${mobileOpen ? "-translate-y-[5px] -rotate-45" : ""
                  }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`md:hidden border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 backdrop-blur transition-all duration-200 ${mobileOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
          }`}
      >
        <div className="container py-3 space-y-3">
          <div className="flex flex-col gap-2 text-sm font-medium">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="py-1 text-slate-700 dark:text-slate-200 hover:text-primary transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Auth (mobile) */}
          {mobileAuth()}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
