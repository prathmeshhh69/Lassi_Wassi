import { useState } from "react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarPicker({ selected, onChange, minDate }) {
  const today = new Date();
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const { year, month } = view;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const minStr = minDate || toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () => {
    setView(v =>
      v.month === 0
        ? { year: v.year - 1, month: 11 }
        : { ...v, month: v.month - 1 }
    );
  };
  const nextMonth = () => {
    setView(v =>
      v.month === 11
        ? { year: v.year + 1, month: 0 }
        : { ...v, month: v.month + 1 }
    );
  };

  const cells = [];
  // Leading empty cells
  for (let i = 0; i < firstDay; i++) cells.push(null);
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 w-full max-w-sm select-none shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
        >
          ‹
        </button>
        <span className="font-semibold text-gray-800 text-sm">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
        >
          ›
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const dateStr = toDateStr(year, month, day);
          const isPast = dateStr < minStr;
          const isSelected = dateStr === selected;
          const isToday = dateStr === toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

          return (
            <button
              key={dateStr}
              disabled={isPast}
              onClick={() => !isPast && onChange(dateStr)}
              className={[
                "w-9 h-9 mx-auto rounded-full text-sm font-medium transition-colors",
                isPast
                  ? "text-gray-300 cursor-not-allowed"
                  : isSelected
                  ? "bg-orange-500 text-white shadow-sm"
                  : isToday
                  ? "ring-2 ring-orange-300 text-orange-600 hover:bg-orange-50"
                  : "text-gray-700 hover:bg-orange-50",
              ].join(" ")}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
