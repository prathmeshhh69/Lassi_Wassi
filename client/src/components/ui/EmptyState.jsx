/**
 * EmptyState — consistent empty / error / no-results display
 *
 * icon    : emoji string or ReactNode
 * title   : string
 * message : string
 * action  : { label, onClick } | ReactNode
 */

export default function EmptyState({
  icon = "📭",
  title = "Nothing here yet",
  message,
  action,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-6 gap-4 ${className}`}
    >
      <div className="text-5xl select-none leading-none">{icon}</div>
      <div>
        <p className="text-base font-semibold text-gray-700">{title}</p>
        {message && (
          <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">{message}</p>
        )}
      </div>

      {action &&
        (typeof action === "object" && "label" in action ? (
          <button
            onClick={action.onClick}
            className="mt-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {action.label}
          </button>
        ) : (
          action
        ))}
    </div>
  );
}
