import { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Search,
  AlertTriangle,
  Package2,
  Edit3,
  X,
  Trash,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable, ColumnDef } from "../components/DataTable";
import { DeleteConfirmationModal } from "../components/DeleteConfirmationModal";
import { Toast } from "../components/Toast";
import { clsx } from "clsx";
import { useInventoryStore } from "../store/inventoryStore";

export default function Inventory() {
  const navigate = useNavigate();
  const {
    inventory: items,
    fetchInventory,
    deleteInventoryItem: deleteInventoryItemStore,
    updateInventoryItem: updateInventoryItemStore,
  } = useInventoryStore();

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<(typeof items)[0] | null>(
    null,
  );
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [deleteItem, setDeleteItem] = useState<(typeof items)[0] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const columns = useMemo<ColumnDef<(typeof items)[0]>[]>(
    () => [
      {
        header: "SKU",
        accessorKey: "sku",
        className: "flex-[2] font-mono text-xs flex items-center",
      },
      {
        header: "Name",
        className: "flex-[2] font-medium flex flex-col justify-center truncate",
        cell: (item) => (
          <>
            <span>{item.name}</span>
            <span className="text-xs text-muted-foreground truncate">
              {item.description}
            </span>
          </>
        ),
      },
      {
        header: "Price",
        className: "flex-[2] text-center font-mono",
        cell: (item) => `$${Number(item.unit_price).toFixed(2)}`,
      },
      {
        header: "Stock",
        className: "flex-[2] text-center font-bold",
        cell: (item) => (
          <span
            className={clsx(
              item.stock_level <= item.reorder_level
                ? "text-orange-600"
                : "text-green-600",
              item.stock_level <= 0 && "text-destructive",
            )}
          >
            {item.stock_level}
          </span>
        ),
      },
      {
        header: "Status",
        className: "flex-[2] flex items-center gap-2",
        cell: (item) => {
          const isOutOfStock = item.stock_level <= 0;
          const isLowStock = item.stock_level <= item.reorder_level;

          if (isOutOfStock) {
            return (
              <span className="flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                <AlertTriangle size={12} /> Out of Stock
              </span>
            );
          }
          if (isLowStock) {
            return (
              <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                <AlertTriangle size={12} /> Low Stock
              </span>
            );
          }
          return (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              <Package2 size={12} /> In Stock
            </span>
          );
        },
      },
      {
        header: "Actions",
        className: "flex-[2] flex items-center justify-center gap-2",
        cell: (item) => {
          console.log("item: ", item);
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/inventory/edit/${item.id}`);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <Edit3 size={12} />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem(item);
                  setStockAdjustment(0);
                  setAdjustmentNote("");
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
              >
                <Package2 size={12} />
                Stock
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteItem(item);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors"
              >
                <Trash size={12} />
              </button>
            </div>
          );
        },
      },
    ],
    [],
  );

  const filteredItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [items, searchQuery]);

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <button
          onClick={() => navigate("/inventory/new")}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Add Item
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search items by SKU or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <DataTable
        data={filteredItems}
        columns={columns}
        getRowClassName={(item) =>
          item.stock_level <= 0
            ? "bg-destructive/5 hover:bg-destructive/10"
            : ""
        }
        onRowClick={(item) => console.log("Clicked", item.id)}
      />

      {/* Stock Update Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Update Stock</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Item Info */}
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SKU:</span>
                <span className="font-mono font-medium">
                  {selectedItem.sku}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Item:</span>
                <span className="font-medium">{selectedItem.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Stock:</span>
                <span className="font-bold text-lg">
                  {selectedItem.stock_level}
                </span>
              </div>
            </div>

            {/* Adjustment Input */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock Adjustment</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setStockAdjustment(
                        Math.max(
                          -selectedItem.stock_level,
                          stockAdjustment - 1,
                        ),
                      )
                    }
                    className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md font-bold text-lg transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={stockAdjustment}
                    onChange={(e) => setStockAdjustment(Number(e.target.value))}
                    className="flex-1 p-2 rounded-md border border-input bg-background text-center font-mono text-lg font-bold"
                    placeholder="0"
                  />
                  <button
                    onClick={() => setStockAdjustment(stockAdjustment + 1)}
                    className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md font-bold text-lg transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  New stock:{" "}
                  <span className="font-bold">
                    {selectedItem.stock_level + stockAdjustment}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Note (Optional)</label>
                <textarea
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  className="w-full p-2 rounded-md border border-input bg-background resize-none"
                  rows={3}
                  placeholder="Reason for adjustment..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedItem) {
                    const newStockLevel =
                      selectedItem.stock_level + stockAdjustment;
                    updateInventoryItemStore(selectedItem.id, {
                      stock_level: newStockLevel,
                      status:
                        newStockLevel === 0
                          ? "Out of Stock"
                          : newStockLevel < selectedItem.reorder_level
                            ? "Low Stock"
                            : "In Stock",
                    });
                  }
                  setSelectedItem(null);
                  setToast({
                    message: "Stock updated successfully!",
                    type: "success",
                  });
                }}
                disabled={stockAdjustment === 0}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => {
          setIsDeleting(true);
          if (deleteItem) {
            deleteInventoryItemStore(deleteItem.id);
          }
          setTimeout(() => {
            setIsDeleting(false);
            setDeleteItem(null);
            setToast({
              message: "Item deleted successfully!",
              type: "success",
            });
          }, 500);
        }}
        itemName={deleteItem?.name || ""}
        itemType="Item"
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
