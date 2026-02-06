import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addYears, subYears, setMonth } from "date-fns";
import { cn } from "../lib/utils";
import { CalendarIcon } from "../assets/calenderIcon";

interface MonthPickerProps {
  label?: string;
  error?: string;
  value: string; // Expects "YYYY-MM"
  onChange: (month: string) => void;
  className?: string;
}

export function MonthPicker({
  label,
  error,
  value,
  onChange,
  className,
}: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // viewDate tracks the currently visible year in the picker
  const [viewDate, setViewDate] = useState(() =>
    value ? new Date(value + "-01") : new Date()
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDate = value ? new Date(value + "-01") : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevYear = () => setViewDate(subYears(viewDate, 1));
  const handleNextYear = () => setViewDate(addYears(viewDate, 1));

  const handleMonthClick = (monthIndex: number) => {
    const newDate = setMonth(viewDate, monthIndex);
    onChange(format(newDate, "yyyy-MM"));
    setIsOpen(false);
  };

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

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
            "w-full px-5 py-3 rounded-2xl bg-white/50 border border-gray-200 text-left flex items-center justify-between min-w-44",
            "transition-all duration-300",
            "hover:bg-white hover:border-primary-300 hover:shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white",
            isOpen && "border-primary-500 bg-white ring-2 ring-primary-500/20",
            error && "border-red-500 focus:border-red-500 ring-red-500/20"
          )}
        >
          <span className={cn("block truncate", !value && "text-gray-400")}>
            {value ? format(selectedDate!, "MMMM yyyy") : "Pick a month"}
          </span>
          <CalendarIcon
            className={cn(
              "w-4 h-4 text-gray-400 transition-colors",
              isOpen && "text-primary-500"
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 p-4 bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-xl animate-in fade-in zoom-in-95 duration-200 origin-top min-w-[280px]">
            {/* Header - Now toggles Years instead of Months */}
            <div className="flex items-center justify-between mb-4 px-2">
              <button
                type="button"
                onClick={handlePrevYear}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-semibold text-gray-900">
                {format(viewDate, "yyyy")}
              </h3>
              <button
                type="button"
                onClick={handleNextYear}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Months Grid - 3 columns for better spacing */}
            <div className="grid grid-cols-3 gap-2">
              {months.map((month, idx) => {
                const isSelected = 
                  selectedDate && 
                  selectedDate.getMonth() === idx && 
                  selectedDate.getFullYear() === viewDate.getFullYear();
                
                const isCurrentMonth = 
                  new Date().getMonth() === idx && 
                  new Date().getFullYear() === viewDate.getFullYear();

                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => handleMonthClick(idx)}
                    className={cn(
                      "h-12 text-sm rounded-xl flex items-center justify-center transition-all duration-200 font-medium",
                      "text-gray-700 hover:bg-gray-100",
                      isCurrentMonth && !isSelected && "text-primary-600 bg-primary-50",
                      isSelected && "bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md hover:opacity-90"
                    )}
                  >
                    {month}
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