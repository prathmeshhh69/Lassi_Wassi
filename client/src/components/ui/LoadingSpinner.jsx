/**
 * LoadingSpinner — fullscreen, overlay, inline, or skeleton variants
 *
 * variant : "page" | "overlay" | "inline" | "card"
 * message : optional label shown below spinner
 */

export function Spinner({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="3"
        className="opacity-20"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor" strokeWidth="3"
        strokeLinecap="round"
        className="text-orange-500"
      />
    </svg>
  );
}

export default function LoadingSpinner({ variant = "page", message = "Loading…" }) {
  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-gray-500">
        <Spinner size={16} className="text-orange-500" />
        {message}
      </span>
    );
  }

  if (variant === "card") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Spinner size={36} className="text-orange-500" />
        <p className="text-sm text-gray-400">{message}</p>
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <Spinner size={44} className="text-orange-500" />
          <p className="text-sm font-medium text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  // "page" — center of viewport
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size={44} className="text-orange-500" />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

/* ─── Skeleton bar ────────────────────────────────────────────────────────── */
export function Skeleton({ className = "" }) {
  return <div className={`bg-gray-100 animate-pulse rounded-xl ${className}`} />;
}

/* ─── Card-level skeleton grid ───────────────────────────────────────────── */
export function SkeletonGrid({ count = 6, className = "h-36" }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  );
}
