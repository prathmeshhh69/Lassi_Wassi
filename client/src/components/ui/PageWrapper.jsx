/**
 * PageWrapper — consistent customer-page outer shell
 * Applies max-width + padding that every customer page should share.
 */
export default function PageWrapper({ children, className = "", narrow = false }) {
  return (
    <div
      className={[
        "min-h-screen bg-gray-50",
        className,
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto px-4 sm:px-6 py-8",
          narrow ? "max-w-2xl" : "max-w-6xl",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
