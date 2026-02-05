import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash, Save, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DatePicker } from "../components/DatePicker";

type PurchaseItem = {
  itemId: string;
  quantity: number;
  unitPrice: number;
  description: string;
};

type PurchaseFormValues = {
  supplierName: string;
  companyName: string;
  date: string;
  items: PurchaseItem[];
};

const DUMMY_ITEMS = [
  { id: "1", name: "Wireless Mouse", price: 15.0 }, // Cost price
  { id: "2", name: "Mechanical Keyboard", price: 80.0 },
  { id: "3", name: "USB-C Cable", price: 5.0 },
  { id: "4", name: "Monitor Stand", price: 25.0 },
];

export default function PurchaseForm() {
  const navigate = useNavigate();
  const { register, control, handleSubmit, watch, setValue, setFocus } =
    useForm<PurchaseFormValues>({
      defaultValues: {
        date: new Date().toISOString().split("T")[0],
        items: [{ itemId: "", quantity: 1, unitPrice: 0, description: "" }],
      },
    });

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

  const onSubmit = (data: PurchaseFormValues) => {
    console.log("Purchase Submitted:", data);
    navigate("/purchases");
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
        <h1 className="text-2xl font-bold">New Purchase</h1>
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
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
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
                  <select
                    {...register(`items.${index}.itemId` as const)}
                    className="w-full p-1.5 rounded-md border border-input bg-background text-sm"
                    onChange={(e) => {
                      const item = DUMMY_ITEMS.find(
                        (i) => i.id === e.target.value,
                      );
                      if (item) {
                        setValue(`items.${index}.unitPrice`, item.price);
                      }
                    }}
                  >
                    <option value="">Select Item...</option>
                    {DUMMY_ITEMS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
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
    </div>
  );
}
