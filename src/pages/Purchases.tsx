import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Edit3, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable, ColumnDef } from "../components/DataTable";
import { DeleteConfirmationModal } from "../components/DeleteConfirmationModal";
import { DatePicker } from "../components/DatePicker";
import { Toast } from "../components/Toast";
import { usePurchaseStore } from "../store/purchaseStore";

export default function Purchases() {
  const navigate = useNavigate();
  const {
    purchases,
    totalCount,
    pageSize,
    currentPage,
    fetchPurchases,
    deletePurchase: deletePurchaseStore,
  } = usePurchaseStore();

  const [deletePurchase, setDeletePurchase] = useState<
    (typeof purchases)[0] | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [filterEndDate, setFilterEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    fetchPurchases(currentPage, pageSize, filterDate, filterEndDate);
  }, [fetchPurchases, currentPage, pageSize, filterDate, filterEndDate]);

  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const columns = useMemo<ColumnDef<(typeof purchases)[0]>[]>(
    () => [
      {
        header: "#",
        accessorKey: "id",
        className: "flex-[1] text-muted-foreground",
        cell: (purchase) => `#${String(purchase.id).substring(0, 6)}`,
      },
      {
        header: "Supplier",
        accessorKey: "supplier_name",
        className: "flex-[3] font-medium truncate text-center",
      },
      {
        header: "Date",
        accessorKey: "date",
        className: "flex-[2] text-muted-foreground text-center",
      },
      {
        header: "Items",
        cell: (item) => <span>{item.items_count} items</span>,
        className: "flex-[2] text-center",
      },
      {
        header: "Total",
        accessorKey: "total",
        className: "flex-[2] font-mono font-bold text-center",
        cell: (purchase) => `$${purchase.total}`,
      },
      {
        header: "Status",
        className: "flex-[1] text-center",
        cell: (item) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.status === "Received"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-100 dark:text-blue-400"
                : "bg-orange-100 text-orange-700 dark:bg-orange-100 dark:text-orange-400"
            }`}
          >
            {item.status}
          </span>
        ),
      },
      {
        header: "Actions",
        className: "flex-[2] flex items-center justify-center gap-2",
        cell: (purchase) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/purchases/edit/${purchase.id}`);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              <Edit3 size={12} />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeletePurchase(purchase);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors"
            >
              <Trash size={12} />
            </button>
          </div>
        ),
      },
    ],
    [navigate, setDeletePurchase],
  );

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const matchesSearch = purchase.supplier_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesDate =
        purchase.date >= filterDate && purchase.date <= filterEndDate;
      return matchesSearch && matchesDate;
    });
  }, [purchases, searchQuery, filterDate, filterEndDate]);

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchases</h1>
        <button
          onClick={() => navigate("/purchases/new")}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          New Purchase
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search purchases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            From:
          </span>
          <DatePicker
            value={filterDate}
            onChange={(date) => {
              setFilterDate(date);
              if (date > filterEndDate) {
                setFilterEndDate(date);
              }
            }}
            className=""
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            To:
          </span>
          <DatePicker
            value={filterEndDate}
            onChange={(date) => {
              setFilterEndDate(date);
              if (date < filterDate) {
                setFilterDate(date);
              }
            }}
            className=""
          />
        </div>
      </div>

      <DataTable
        data={filteredPurchases}
        columns={columns}
        onRowClick={(purchase) => console.log("Clicked", purchase.id)}
        isPagination={true}
        currentPage={currentPage}
        totalPages={Math.ceil(totalCount / pageSize)}
        goToPage={(page) =>
          fetchPurchases(page, pageSize, filterDate, filterEndDate)
        }
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deletePurchase !== null}
        onClose={() => setDeletePurchase(null)}
        onConfirm={() => {
          setIsDeleting(true);
          if (deletePurchase) {
            deletePurchaseStore(deletePurchase.id);
          }
          setTimeout(() => {
            setIsDeleting(false);
            setDeletePurchase(null);
            setToast({
              message: "Purchase deleted successfully!",
              type: "success",
            });
          }, 500);
        }}
        itemName={`Purchase #${deletePurchase?.id}` || ""}
        itemType="Purchase"
        isDeleting={isDeleting}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
