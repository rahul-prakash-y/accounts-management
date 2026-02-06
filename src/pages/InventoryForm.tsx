import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Save, ArrowLeft, Package2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useInventoryStore } from "../store/inventoryStore";
import { Toast } from "../components/Toast";

type InventoryFormValues = {
  id: string;
  sku: string;
  name: string;
  description: string;
  unit_price: number;
  stock_level: number;
  reorder_level: number;
  status: string;
  price: number;
};

export default function InventoryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const fetchInventory = useInventoryStore((s) => s.fetchInventory);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const createItem = useInventoryStore((s) => s.addInventoryItem);
  const updateItem = useInventoryStore((s) => s.updateInventoryItem);
  const inventoryItems = useInventoryStore((s) => s.inventory);
  const editableItem = inventoryItems?.find((item) => item?.id === id);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryFormValues>({
    defaultValues: {
      stock_level: editableItem?.stock_level || 0,
      reorder_level: editableItem?.reorder_level || 10,
      status: editableItem?.status || "In Stock",
      id: editableItem?.id || "",
      description: editableItem?.description || "",
      unit_price: editableItem?.unit_price || 0,
      price: editableItem?.price || 0,
      name: editableItem?.name || "",
      sku: editableItem?.sku || "",
    },
  });

  useEffect(() => {
    if (editableItem) {
      reset({
        stock_level: editableItem.stock_level,
        reorder_level: editableItem.reorder_level,
        status: editableItem.status,
        id: editableItem.id,
        description: editableItem.description || "",
        unit_price: editableItem.unit_price,
        price: editableItem.price,
        name: editableItem.name,
        sku: editableItem.sku,
      });
    }
  }, [editableItem, reset]);

  const onSubmit = async (data: InventoryFormValues) => {
    console.log("Inventory Item Created:", data);

    // Calculate status based on stock level
    let status = "In Stock";
    if (data.stock_level <= 0) {
      status = "Out of Stock";
    } else if (data.stock_level < data.reorder_level) {
      status = "Low Stock";
    }

    try {
      if (editableItem) {
        await updateItem(editableItem?.id, { ...data, status });
        setToast({
          message: "Inventory item updated successfully!",
          type: "success",
        });
      } else {
        await createItem({ ...data, status });
        setToast({
          message: "Inventory item created successfully!",
          type: "success",
        });
      }
      setTimeout(() => navigate("/inventory"), 1000);
    } catch (error) {
      console.error("Failed to save inventory item:", error);
      setToast({
        message: "Failed to save item. Please try again.",
        type: "error",
      });
    }
  };

  const onError = (errors: any) => {
    console.log("Form Errors:", errors);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/inventory")}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <Package2 className="text-primary" size={24} />
          <h1 className="text-2xl font-bold">
            {editableItem ? "Edit" : "New"} Inventory Item
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">SKU / Item Code</label>
              <input
                {...register("sku", { required: "SKU is required" })}
                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="PROD-1001"
                autoFocus
              />
              {errors.sku && (
                <p className="text-xs text-destructive">{errors.sku.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Product Name</label>
              <input
                {...register("name", { required: "Name is required" })}
                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              {...register("description")}
              className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[100px]"
              placeholder="Detailed product information..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                {...register("unit_price", {
                  required: "Unit price is required",
                  min: { value: 0, message: "Price must be positive" },
                  valueAsNumber: true,
                })}
                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="0.00"
              />
              {errors.unit_price && (
                <p className="text-xs text-destructive">
                  {errors.unit_price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Initial Stock</label>
              <input
                type="number"
                {...register("stock_level", {
                  required: "Stock level is required",
                  min: { value: 0, message: "Stock cannot be negative" },
                  valueAsNumber: true,
                })}
                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              {errors.stock_level && (
                <p className="text-xs text-destructive">
                  {errors.stock_level.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reorder Level</label>
              <input
                type="number"
                {...register("reorder_level", {
                  required: "Reorder level is required",
                  min: { value: 0, message: "Level cannot be negative" },
                  valueAsNumber: true,
                })}
                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              {errors.reorder_level && (
                <p className="text-xs text-destructive">
                  {errors.reorder_level.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Price</label>
              <input
                type="number"
                step="0.01"
                {...register("price", {
                  required: "Selling price is required",
                  min: { value: 0, message: "Price must be positive" },
                  valueAsNumber: true,
                })}
                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              {errors.price && (
                <p className="text-xs text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/inventory")}
            className="px-6 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
          >
            <Save size={18} />
            Save Item
          </button>
        </div>
      </form>

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
