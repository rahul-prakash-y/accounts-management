import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

export type ColumnDef<T> = {
  header: React.ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
};

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (item: T) => void;
  getRowClassName?: (item: T) => string;
  estimateRowHeight?: number;
  height?: string | number;
  currentPage?: number;
  totalPages?: number;
  goToPage?: (page: number) => void;
  isPagination?: boolean
}

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  getRowClassName,
  estimateRowHeight = 60,
  currentPage=10,
  totalPages,
  goToPage,
  isPagination = false,
}: DataTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: 10,
  });

  return (
    <div className="flex flex-col gap-y-5">
      <div className="flex-1 border border-black/20 rounded-2xl bg-card/30 backdrop-blur-xl overflow-hidden flex flex-col shadow-2xl shadow-black/[0.02] dark:shadow-white/[0.02] ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center gap-4 px-8 py-5 border-b border-border/20 bg-muted/80 backdrop-blur-2xl sticky top-0 z-10 shadow-sm shadow-black/[0.01]">
          {columns.map((col, index) => (
            <div
              key={index}
              className={clsx(
                "text-[0.65rem] uppercase tracking-[0.2em] font-black text-muted-foreground/60 select-none",
                col.className || "flex-1",
              )}
            >
              {col.header}
            </div>
          ))}
        </div>

        {/* Body */}
        <div
          className="flex-1 overflow-auto custom-scrollbar scroll-smooth"
          ref={parentRef}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = data[virtualRow.index];
              const customRowClass = getRowClassName ? getRowClassName(item) : "";

              return (
                <div
                  key={virtualRow.index}
                  onClick={() => onRowClick && onRowClick(item)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={clsx(
                    "flex items-center gap-4 px-8 border-b border-border/5 transition-all duration-300 ease-out group/row",
                    onRowClick
                      ? "cursor-pointer hover:bg-primary/[0.03] active:bg-primary/[0.06]"
                      : "hover:bg-muted/10",
                    customRowClass,
                  )}
                >
                  {columns.map((col, colIndex) => (
                    <div
                      key={colIndex}
                      className={clsx(
                        "text-[0.85rem] text-foreground/80 leading-relaxed font-medium transition-all group-hover/row:text-foreground group-hover/row:translate-x-0.5",
                        col.className || "flex-1",
                      )}
                    >
                      {col.cell
                        ? col.cell(item)
                        : col.accessorKey
                          ? String(item[col.accessorKey])
                          : null}
                    </div>
                  ))}
                </div>
              );
            })}

            {data.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-16 space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center ring-1 ring-primary/10 shadow-inner">
                  <span className="text-2xl grayscale brightness-110">📂</span>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold tracking-tight text-foreground/80">
                    Nothing to display
                  </p>
                  <p className="text-sm text-muted-foreground/60 mt-1 max-w-[200px]">
                    It seems we couldn't find any records matching your criteria.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {isPagination && (<div className="flex items-center justify-between px-4 py-2 bg-card border border-border rounded-lg shadow-sm">
          <span className="text-sm text-gray-700">
            Page <span className="font-semibold">{currentPage || 1}</span> of{" "}
            <span className="font-semibold">{totalPages || 1}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage?.((currentPage || 1) - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages || 10 }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage?.(page)}
                className={cn("px-3 py-1 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors",{
                  "bg-primary text-primary-foreground hover:bg-primary/80": currentPage === page,
                })}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => goToPage?.((currentPage || 1) + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>)}
    </div>
  );
}
