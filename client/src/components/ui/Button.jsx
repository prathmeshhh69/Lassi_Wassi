/**
 * Button — unified button primitive
 *
 * variant : "primary" | "secondary" | "ghost" | "danger" | "outline"
 * size    : "sm" | "md" | "lg"
 * loading : bool
 * icon    : ReactNode (placed before children)
 * full    : bool (w-full)
 */
import { forwardRef } from "react";

const VARIANTS = {
  primary:   "bg-orange-500 hover:bg-orange-600 text-white shadow-sm",
  secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800",
  ghost:     "bg-transparent hover:bg-gray-100 text-gray-700",
  danger:    "bg-red-500 hover:bg-red-600 text-white shadow-sm",
  outline:   "border border-gray-200 hover:border-orange-400 hover:text-orange-500 text-gray-700 bg-white",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2",
};

const Spinner = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V0a12 12 0 100 24v-4l-3 3 3 3v4A12 12 0 014 12z" />
  </svg>
);

const Button = forwardRef(({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  full = false,
  className = "",
  type = "button",
  ...rest
}, ref) => {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2",
        VARIANTS[variant],
        SIZES[size],
        full ? "w-full" : "",
        isDisabled ? "opacity-50 cursor-not-allowed" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {loading ? <Spinner /> : icon ? <span className="shrink-0">{icon}</span> : null}
      {children && <span>{children}</span>}
    </button>
  );
});

Button.displayName = "Button";
export default Button;
