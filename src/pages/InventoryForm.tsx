import { useState } from "react";
import { useForm } from "react-hook-form";
import { Save, ArrowLeft, Package2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useDataStore } from "../store/dataStore";
import { Toast } from "../components/Toast";

type InventoryFormValues = {
  id: number;
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
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const createItem = useDataStore((s) => s.addInventoryItem);
  const updateItem = useDataStore((s) => s.updateInventoryItem);
  const inventoryItems = useDataStore((s) => s.inventory);
  const editableItem = inventoryItems?.find((item) => item?.id === Number(id));
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InventoryFormValues>({
    defaultValues: {
      stock_level: editableItem?.stock_level || 0,
      reorder_level: editableItem?.reorder_level || 10,
      status: editableItem?.status || "Active",
      id: editableItem?.id || 0,
      description: editableItem?.description || "",
      unit_price: editableItem?.unit_price || 0,
      price: editableItem?.price || 0,
      name: editableItem?.name || "",
      sku: editableItem?.sku || "",
    },
  });

  const onSubmit = (data: InventoryFormValues) => {
    console.log("Inventory Item Created:", data);
    if (editableItem) {
      updateItem(editableItem?.id, data);
      setToast({
        message: "Inventory item updated successfully!",
        type: "success",
      });
    } else {
      createItem({ ...data, id: inventoryItems?.length + 1 });
      setToast({
        message: "Inventory item created successfully!",
        type: "success",
      });
    }
    setTimeout(() => navigate("/inventory"), 1000);
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  required: true,
                  min: 0,
                  valueAsNumber: true,
                })}
                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Initial Stock</label>
              <input
                type="number"
                {...register("stock_level", {
                  required: true,
                  min: 0,
                  valueAsNumber: true,
                })}
                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reorder Level</label>
              <input
                type="number"
                {...register("reorder_level", {
                  required: true,
                  min: 0,
                  valueAsNumber: true,
                })}
                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Price</label>
              <input
                type="number"
                {...register("price", {
                  required: true,
                  min: 0,
                  valueAsNumber: true,
                })}
                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
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
