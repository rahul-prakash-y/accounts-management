import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className,
  error,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const selectedOption = options.find((opt) => opt.value === value);

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
            "w-full px-5 py-3 rounded-2xl bg-white/50 border border-gray-200 text-left flex items-center justify-between transition-all duration-300",
            "hover:bg-white hover:border-primary-300 hover:shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white",
            isOpen && "border-primary-500 bg-white ring-2 ring-primary-500/20",
            error && "border-red-500 focus:border-red-500 ring-red-500/20",
          )}
        >
          <span className={cn("block truncate", !value && "text-gray-400")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform duration-300",
              isOpen && "text-primary-500 transform rotate-180",
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200 origin-top overflow-hidden">
            <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No options found
                </div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 text-sm text-left transition-colors flex items-center justify-between",
                      value === option.value
                        ? "bg-primary-50 text-primary-600 font-medium"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    <span>{option.label}</span>
                    {value === option.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    )}
                  </button>
                ))
              )}
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
