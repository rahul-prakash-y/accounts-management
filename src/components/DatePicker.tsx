import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { cn } from "../lib/utils";
import { CalendarIcon } from "../assets/calenderIcon";

interface DatePickerProps {
  label?: string;
  error?: string;
  value: string;
  onChange: (date: string) => void; // Expects ISO date string YYYY-MM-DD
  className?: string;
  required?: boolean;
}

export function DatePicker({
  label,
  error,
  value,
  onChange,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Initialize viewDate to the selected value or today
  const [viewDate, setViewDate] = useState(() =>
    value ? new Date(value) : new Date()
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current selected date safely
  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));

  const handleDateClick = (date: Date) => {
    // Return formatted date string YYYY-MM-DD to match input type="date" behavior
    onChange(format(date, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  // Generate calendar days
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full px-5 py-3 rounded-2xl bg-white/50 border border-gray-200 text-left flex items-center justify-between",
            "transition-all duration-300",
            "hover:bg-white hover:border-primary-300 hover:shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white",
            isOpen && "border-primary-500 bg-white ring-2 ring-primary-500/20",
            error && "border-red-500 focus:border-red-500 ring-red-500/20"
          )}
        >
          <span className={cn("block truncate", !value && "text-gray-400")}>
            {value ? format(selectedDate!, "MMM dd, yyyy") : "Pick a date"}
          </span>
          <CalendarIcon
            className={cn(
              "w-4 h-4 text-gray-400 transition-colors",
              isOpen && "text-primary-500"
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 p-4 bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-xl animate-in fade-in zoom-in-95 duration-200 origin-top min-w-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-semibold text-gray-900">
                {format(viewDate, "MMMM yyyy")}
              </h3>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  className="text-xs font-medium text-gray-400 text-center py-1"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, idx) => {
                const isSelected =
                  selectedDate && isSameDay(date, selectedDate);
                const isCurrentMonth = isSameMonth(date, viewDate);
                const isTodayDate = isToday(date);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDateClick(date)}
                    className={cn(
                      "h-9 w-9 text-sm rounded-xl flex items-center justify-center transition-all duration-200",
                      !isCurrentMonth && "text-gray-300",
                      isCurrentMonth && "text-gray-700 hover:bg-gray-100",
                      isTodayDate &&
                        !isSelected &&
                        "text-primary-600 font-semibold bg-primary-50",
                      isSelected &&
                        "bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md hover:bg-primary-600"
                    )}
                  >
                    {format(date, "d")}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500 ml-1 animate-in slide-in-from-left-1">
          {error}
        </p>
      )}
    </div>
  );
}
