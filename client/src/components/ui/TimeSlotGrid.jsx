/**
 * TimeSlotGrid — reusable slot picker
 *
 * Props:
 *   slots          — array from API: { time, available, occupied, capacity, label? }
 *   selected       — currently selected time string (HH:MM)
 *   onSelect       — (time) => void
 *   disabledFn     — optional (slot) => bool — extra disable logic (e.g. party size check)
 *   loading        — show skeleton
 *   emptyMessage   — string shown when slots is empty and not loading
 */
export default function TimeSlotGrid({
  slots = [],
  selected,
  onSelect,
  disabledFn,
  loading = false,
  emptyMessage = "No slots available for this date.",
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!slots.length) {
    return (
      <p className="text-sm text-gray-400 mt-3 text-center py-6">{emptyMessage}</p>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
      {slots.map(slot => {
        const isDisabled = !slot.available || (disabledFn && disabledFn(slot));
        const isSelected = selected === slot.time;
        const fill = slot.capacity > 0 ? slot.occupied / slot.capacity : 0;

        let stateStyle = "";
        if (isSelected) {
          stateStyle = "bg-orange-500 text-white border-orange-500 shadow-md";
        } else if (isDisabled) {
          stateStyle = "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed";
        } else if (fill >= 0.8) {
          stateStyle =
            "bg-red-50 text-red-600 border-red-200 hover:bg-red-100";
        } else {
          stateStyle =
            "bg-white text-gray-700 border-gray-200 hover:border-orange-400 hover:bg-orange-50";
        }

        return (
          <button
            key={slot.time}
            disabled={isDisabled}
            onClick={() => !isDisabled && onSelect(slot.time)}
            className={`flex flex-col items-center justify-center rounded-xl border p-2 transition-all text-xs font-medium ${stateStyle}`}
          >
            <span className="text-sm font-semibold">{slot.time}</span>
            {slot.capacity > 0 && (
              <>
                <div className="w-full mt-1 h-1 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isSelected
                        ? "bg-white opacity-70"
                        : fill >= 0.8
                        ? "bg-red-400"
                        : "bg-orange-400"
                    }`}
                    style={{ width: `${Math.min(fill * 100, 100)}%` }}
                  />
                </div>
                <span className="mt-0.5 opacity-70">
                  {slot.occupied}/{slot.capacity}
                </span>
              </>
            )}
            {!slot.available && !isSelected && (
              <span className="text-xs font-normal mt-0.5">
                {slot.occupied === undefined ? "Past" : "Full"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
