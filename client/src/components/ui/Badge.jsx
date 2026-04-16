/**
 * Badge — status / category / label chip
 *
 * variant : "default" | "success" | "warning" | "danger" | "info" | "neutral"
 * size    : "sm" | "md"
 * dot     : bool — show a leading colored dot
 */

const VARIANTS = {
  default: "bg-orange-100 text-orange-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger:  "bg-red-100 text-red-600",
  info:    "bg-blue-100 text-blue-700",
  neutral: "bg-gray-100 text-gray-600",
};

const DOT_COLORS = {
  default: "bg-orange-500",
  success: "bg-emerald-500",
  warning: "bg-amber-400",
  danger:  "bg-red-500",
  info:    "bg-blue-500",
  neutral: "bg-gray-400",
};

const SIZES = {
  sm: "text-xs px-2 py-0.5 rounded-md",
  md: "text-xs px-2.5 py-1 rounded-lg",
};

export default function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 font-medium",
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(" ")}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[variant]}`}
        />
      )}
      {children}
    </span>
  );
}
