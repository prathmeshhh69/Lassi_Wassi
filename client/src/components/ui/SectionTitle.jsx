/**
 * SectionTitle — consistent heading + optional sub / action row
 *
 * title    : string (required)
 * subtitle : string
 * action   : ReactNode — rendered right-aligned
 * center   : bool
 * size     : "sm" | "md" | "lg"
 */

const SIZES = {
  sm: { h: "text-lg font-bold", sub: "text-xs" },
  md: { h: "text-xl font-bold", sub: "text-sm" },
  lg: { h: "text-2xl sm:text-3xl font-extrabold", sub: "text-sm sm:text-base" },
};

export default function SectionTitle({
  title,
  subtitle,
  action,
  center = false,
  size = "md",
  className = "",
}) {
  const s = SIZES[size] ?? SIZES.md;
  return (
    <div
      className={[
        "flex flex-wrap items-start gap-3",
        center ? "flex-col items-center text-center" : "justify-between",
        className,
      ].join(" ")}
    >
      <div>
        <h2 className={`text-gray-900 leading-tight ${s.h}`}>{title}</h2>
        {subtitle && (
          <p className={`text-gray-500 mt-1 ${s.sub}`}>{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
