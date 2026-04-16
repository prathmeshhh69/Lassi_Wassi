import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { FiGithub, FiInstagram, FiLinkedin, FiTwitter } from "react-icons/fi";
import Navbar from "./Navbar.jsx";

const ease = [0.22, 0.61, 0.36, 1];
const THEME_KEY = "lassi-wassi-theme";

function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-16 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-dark dark:text-light">
              Lassi Wassi
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Food delivery • Pre-order • Live tracking
            </p>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} Lassi Wassi. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { label: "Instagram", Icon: FiInstagram, href: "#" },
              { label: "Twitter", Icon: FiTwitter, href: "#" },
              { label: "LinkedIn", Icon: FiLinkedin, href: "#" },
              { label: "GitHub", Icon: FiGithub, href: "#" }
            ].map(({ label, Icon, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-800 hover:text-primary hover:ring-primary/30 transition-colors-transform ease-soft-out"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function Layout({ children, pageKey = "home" }) {
  const [isDark, setIsDark] = useState(false);

  const applyTheme = (dark) => {
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch (e) {}
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "dark" || stored === "light") {
        setIsDark(stored === "dark");
        return;
      }
    } catch (e) {}

    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(Boolean(prefersDark));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }, [isDark]);

  const toggleTheme = useMemo(
    () => () => applyTheme(!isDark),
    [isDark]
  );

  return (
    <div className="min-h-screen bg-light text-dark dark:bg-dark dark:text-light transition-colors duration-300 flex flex-col">
      <Navbar isDark={isDark} onToggleTheme={toggleTheme} />

      <AnimatePresence mode="wait">
        <motion.main
          key={pageKey}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease }}
          className="flex-1 mx-auto w-full max-w-7xl px-6 md:px-16"
        >
          <div className="py-6 sm:py-8">{children}</div>
        </motion.main>
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default Layout;

