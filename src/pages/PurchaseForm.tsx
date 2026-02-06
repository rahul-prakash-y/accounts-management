import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash, Save, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { DatePicker } from "../components/DatePicker";
import { PurchaseItem, usePurchaseStore } from "../store/purchaseStore";
import { useInventoryStore } from "../store/inventoryStore";
import { useTransactionStore, Transaction } from "../store/transactionStore";
import { Toast } from "../components/Toast";
import { Select } from "../components/Select";

type PurchaseFormValues = {
  supplierName: string;
  companyName: string;
  date: string;
  items: PurchaseItem[];
  paymentMode: "Cash" | "UPI" | "Card" | "Net Banking";
};

export default function PurchaseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const inventoryItems = useInventoryStore((state) => state.inventory);
  console.log("inventoryItems: ", inventoryItems);
  const fetchInventory = useInventoryStore((state) => state.fetchInventory);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const deleteTransaction = useTransactionStore(
    (state) => state.deleteTransaction,
  );

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [originalItems, setOriginalItems] = useState<PurchaseItem[]>([]);

  const { register, control, handleSubmit, watch, setValue, setFocus, reset } =
    useForm<PurchaseFormValues>({
      defaultValues: {
        date: new Date().toISOString().split("T")[0],
        items: [{ itemId: "", quantity: 1, unitPrice: 0, description: "" }],
        paymentMode: "Cash",
      },
    });
  const purchases = usePurchaseStore((state) => state.purchases);
  const updatePurchase = usePurchaseStore((s) => s.updatePurchase);
  const addPurchase = usePurchaseStore((s) => s.addPurchase);
  const updateInventoryItem = useInventoryStore((s) => s.updateInventoryItem);

  // Load existing purchase if in edit mode
  React.useEffect(() => {
    if (id) {
      const purchase = purchases.find((p) => p.id === id);
      if (purchase) {
        // Map purchase items to form values
        // Note: We need to ensure types match. purchase.items should be PurchaseItem[]
        reset({
          supplierName: purchase.supplier_name,
          companyName: purchase.company_name || "",
          date: purchase.date,
          paymentMode: purchase.paymentMode || "Cash",
          // Ensure we map items correctly and handle potential undefined
          items:
            purchase.items && purchase.items.length > 0
              ? purchase.items
              : [{ itemId: "", quantity: 1, unitPrice: 0, description: "" }],
        });
        setOriginalItems(purchase.items || []);
      }
    }
  }, [id, purchases, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");
  const total = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0,
  );

  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    field: keyof PurchaseItem,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index === fields.length - 1 && field === "unitPrice") {
        append({ itemId: "", quantity: 1, unitPrice: 0, description: "" });
        setTimeout(() => {
          setFocus(`items.${index + 1}.itemId` as any);
        }, 50);
      }
    }
  };

  const onSubmit = async (data: PurchaseFormValues) => {
    try {
      const isEdit = !!id;
      let purchaseId = id;
      // We no longer use 'PUR-' prefix because transactions.id is a UUID column.
      // We will use the purchaseId (UUID) as the transaction ID.
      let transactionId = purchaseId;

      if (isEdit && purchaseId) {
        // 1. Revert Old Stock
        for (const item of originalItems) {
          const inventoryItem = inventoryItems.find(
            (i) => i.id === item.itemId,
          );
          if (inventoryItem) {
            await updateInventoryItem(inventoryItem.id, {
              stock_level:
                (inventoryItem.stock_level || 0) - Number(item.quantity),
              // Note: We don't revert price as it might have been updated by other purchases
            });
          }
        }

        // 2. Delete Old Transaction
        if (transactionId) {
          await deleteTransaction(transactionId);
        }
      }

      // 3. Update/Create new stock
      for (const item of data.items) {
        const inventoryItem = inventoryItems.find((i) => i.id === item.itemId);
        if (inventoryItem) {
          await updateInventoryItem(inventoryItem.id, {
            stock_level:
              (inventoryItem.stock_level || 0) + Number(item.quantity),
            unit_price: Number(item.unitPrice), // Update cost price to latest
          });
        }
      }

      // 4. Create/Update Purchase Record
      const purchaseData: any = {
        totalAmount: total,
        supplierName: data.supplierName,
        paymentStatus: "Paid",

        id: purchaseId,
        supplier_name: data.supplierName,
        company_name: data.companyName,
        date: data.date,
        total: total,
        status: "Received",
        items_count: data.items.length,
        items: data.items,
        paymentMode: data.paymentMode,
      };

      if (isEdit && purchaseId) {
        await updatePurchase(purchaseId, purchaseData);
      } else {
        purchaseId = await addPurchase(purchaseData);
        transactionId = purchaseId;
      }

      // 5. Create Transaction
      if (!transactionId) {
        throw new Error("Failed to determine transaction ID");
      }

      const newTransaction: Transaction = {
        id: transactionId,
        type: "purchase",
        date: data.date,
        description: `Purchase from ${data.supplierName}`,
        amount: total,
        supplier: data.supplierName,
        paymentMode: data.paymentMode,
      };

      await addTransaction(newTransaction);

      setToast({
        message: isEdit
          ? "Purchase updated successfully!"
          : "Purchase saved successfully!",
        type: "success",
      });

      setTimeout(() => {
        navigate("/purchases");
      }, 1000);
    } catch (error) {
      console.error("Error saving purchase:", error);
      setToast({ message: "Failed to save purchase.", type: "error" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/purchases")}
          className="p-2 hover:bg-muted rounded-full"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">
          {id ? "Edit Purchase" : "New Purchase"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier Name</label>
            <input
              {...register("supplierName", { required: true })}
              className="w-full p-2 rounded-md border border-input bg-background"
              placeholder="Enter supplier name"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <DatePicker
              label="Date"
              value={watch("date")}
              onChange={(date) => setValue("date", date)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Company Name (Optional)
            </label>
            <input
              {...register("companyName")}
              className="w-full p-2 rounded-md border border-input bg-background"
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Mode</label>
            <select
              {...register("paymentMode")}
              className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 font-medium text-sm text-muted-foreground border-b border-border">
            <div className="col-span-4">Item</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Cost Price</div>
            <div className="col-span-3 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>

          <div className="divide-y divide-border">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-2 p-2 items-center hover:bg-muted/10"
              >
                <div className="col-span-4">
                  <Select
                    options={inventoryItems.map((item) => ({
                      value: item.id.toString(),
                      label: item.name,
                    }))}
                    value={items[index]?.itemId?.toString() || ""}
                    onChange={(value) => {
                      setValue(`items.${index}.itemId`, value); // Helper to set ID
                      const item = inventoryItems.find((i) => i.id === value);
                      if (item) {
                        setValue(`items.${index}.unitPrice`, item.price);
                      }
                    }}
                    placeholder="Select Item..."
                    className="w-full"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    {...register(`items.${index}.quantity` as const, {
                      valueAsNumber: true,
                    })}
                    className="w-full p-1.5 rounded-md border border-input bg-background text-right text-sm"
                    min="1"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.unitPrice` as const, {
                      valueAsNumber: true,
                    })}
                    className="w-full p-1.5 rounded-md border border-input bg-background text-right text-sm"
                    onKeyDown={(e) => handleKeyDown(e, index, "unitPrice")}
                  />
                </div>
                <div className="col-span-3 text-right font-mono text-sm px-2">
                  $
                  {(
                    (items[index]?.quantity || 0) *
                    (items[index]?.unitPrice || 0)
                  ).toFixed(2)}
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 bg-muted/20 border-t border-border">
            <button
              type="button"
              onClick={() =>
                append({
                  itemId: "",
                  quantity: 1,
                  unitPrice: 0,
                  description: "",
                })
              }
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium px-2 py-1"
            >
              <Plus size={16} /> Add Line
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="w-full md:w-1/3 bg-card p-6 rounded-xl border border-border shadow-sm space-y-4">
            <div className="flex justify-between font-bold text-lg">
              <span>Total Cost</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 flex items-center justify-center gap-2 mt-4"
            >
              <Save size={20} />
              Save Purchase
            </button>
          </div>
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
