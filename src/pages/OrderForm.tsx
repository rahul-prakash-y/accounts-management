import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash, Save, ArrowLeft, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { InvoiceTemplate } from "../components/InvoiceTemplate";
import { DatePicker } from "../components/DatePicker";
import { Select } from "../components/Select";
import { Toast } from "../components/Toast";
import { useOrderStore, OrderItem } from "../store/orderStore";
import { useCustomerStore } from "../store/customerStore";
import { useSettingsStore } from "../store/settingsStore";
import { useEmployeeStore } from "../store/employeeStore";
import { useInventoryStore } from "../store/inventoryStore";

// Types
// OrderItem is imported from store now

type OrderFormValues = {
  id: string | number;
  customer_name: string;
  customer_address: string;
  salesman_no: string;
  date: string;
  items: OrderItem[];
  discount: number;
  total: number;
  status: string;
  amountPaid: number;
  paymentStatus: "Unpaid" | "Partial" | "Paid";
  paymentMode: "Cash" | "UPI" | "Card" | "Net Banking";
  subCompanyId?: string;
};

export default function OrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  console.log("id: ", id);
  console.log("id: ", id);
  const { customers, fetchCustomers } = useCustomerStore();
  const { subCompanies, fetchSettings } = useSettingsStore();
  const { employees: salemens, fetchEmployees } = useEmployeeStore();
  const { inventory: inventoryItems, fetchInventory } = useInventoryStore();
  const {
    addOrder: createSale,
    updateOrder: updateSale,
    orders,
    fetchOrders,
  } = useOrderStore();

  useEffect(() => {
    fetchCustomers();
    fetchSettings();
    fetchEmployees();
    fetchInventory();
    fetchOrders();
  }, [
    fetchCustomers,
    fetchSettings,
    fetchEmployees,
    fetchInventory,
    fetchOrders,
  ]);

  console.log("inventoryItems", inventoryItems);

  const customers_options = customers?.map((cus: any) => {
    return {
      value: cus.name,
      label: cus.name,
      address: cus.address,
    };
  });
  const salemens_options = salemens
    ?.filter((sale: any) => sale.department === "Sales")
    .map((sale: any) => {
      return {
        value: sale.id,
        label: sale.name,
      };
    });
  const inventoryItemsOptions = inventoryItems?.map((item) => {
    return {
      value: String(item.id),
      label: item.name,
      unitPrice: item.unit_price,
      price: item.price,
    };
  });
  const subCompanyOptions = subCompanies?.map((sc) => ({
    value: sc.id,
    label: sc.name,
  }));

  // const orders = useOrderStore((s) => s.orders); // Already destructured above

  const editableOrder =
    id && id !== "new" ? orders?.find((o) => String(o.id) === id) : null;

  const { register, control, handleSubmit, watch, setValue, setFocus } =
    useForm<OrderFormValues>({
      defaultValues: {
        id: editableOrder?.id || `temp-${Date.now()}`,
        status: editableOrder?.status || "Pending",
        total: editableOrder?.total || 0,
        amountPaid: editableOrder?.amountPaid || 0,
        paymentStatus: editableOrder?.paymentStatus || "Unpaid",
        paymentMode: editableOrder?.paymentMode || "Cash",
        subCompanyId: editableOrder?.subCompanyId || "",
        customer_name: editableOrder?.customer_name || "",
        customer_address: editableOrder?.customer_address || "",
        salesman_no: editableOrder?.salesman_no || "",
        date: editableOrder?.date
          ? new Date(
              editableOrder.date || editableOrder.created_at || new Date(),
            )
              .toISOString()
              .split("T")[0]
          : new Date().toISOString().split("T")[0],
        items: editableOrder?.items || [
          {
            itemId: "",
            quantity: 1,
            freeQty: 0,
            unitPrice: 0,
            sellingPrice: 0,
            description: "",
          },
        ],
        discount: editableOrder?.discount || 0,
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Invoice",
  });

  const watchAllFields = watch();

  // Transform form data for invoice preview
  const selectedSalesman = salemens?.find(
    (s) => s.id === watchAllFields.salesman_no,
  );
  const invoiceData = {
    id: "NEW", // Dynamic ID in real app
    date: watchAllFields.date,
    customer_name: watchAllFields.customer_name || "Customer Name",
    customer_address: watchAllFields.customer_address,
    salesman_no: selectedSalesman?.name || watchAllFields.salesman_no,
    subCompanyId: watchAllFields.subCompanyId,
    status: watchAllFields.status || "Pending",
    items: watchAllFields.items.map((item) => ({
      ...item,
      quantity: item.quantity,
      sellingPrice: item.sellingPrice,
      description: item.description || "Item",
    })),
    discount: watchAllFields.discount || 0,
    total:
      watchAllFields.items.reduce(
        (sum, i) => sum + i.quantity * (i.sellingPrice || 0),
        0,
      ) - (watchAllFields.discount || 0),
  };

  const items = watch("items");

  // Calculate Totals
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * (item.sellingPrice || 0),
    0,
  );
  const totalQuantity = items.reduce(
    (sum, item) => sum + (item.quantity || 0) + (item.freeQty || 0),
    0,
  );
  const discount = watch("discount") || 0;
  const grandTotal = subtotal - discount;

  // Keyboard Navigation: Enter to add row
  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    field: keyof OrderItem,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent submit

      // If last item and last field, add new row
      if (index === fields.length - 1 && field === "unitPrice") {
        // Assuming Unit Price is last editable field
        append({
          itemId: "",
          quantity: 1,
          freeQty: 0,
          unitPrice: 0,
          sellingPrice: 0,
          description: "",
        });
        // Focus will be handled by useEffect or manually
        // We'll set focus to the new row's first input after render
        setTimeout(() => {
          setFocus(`items.${index + 1}.itemId` as any);
        }, 50);
      }
    }
  };

  const onSubmit = async (data: OrderFormValues) => {
    // Validation
    if (!data.subCompanyId) {
      setToast({
        message: "Please select a Bill From (Sub-company)",
        type: "error",
      });
      return;
    }
    if (!data.customer_name) {
      setToast({ message: "Please select a Customer", type: "error" });
      return;
    }
    if (!data.salesman_no) {
      setToast({ message: "Please select a Salesman", type: "error" });
      return;
    }

    // Filter out empty items (rows with no item selected)
    const validItems = data.items.filter(
      (item) => item.itemId && item.quantity > 0,
    );

    if (validItems.length === 0) {
      setToast({
        message: "Please add at least one valid item to the order",
        type: "error",
      });
      return;
    }

    // Set the total field with the calculated grand total and use filtered items
    // Find selected customer object to get ID
    const selectedCustomer = customers?.find(
      (c) => c.name === data.customer_name,
    );
    // Find selected salesman object to get ID
    const selectedSalesman = salemens?.find((s) => s.id === data.salesman_no);

    const orderData = {
      ...data,
      id: String(data.id), // Ensure ID is a string for Supabase
      customer_id: selectedCustomer?.id, // Pass customer UUID
      salesman_id: selectedSalesman?.id, // Pass salesman UUID
      salesman_no: selectedSalesman?.id, // Keep for compatibility if needed, but ID is primary
      items: validItems,
      total: grandTotal,
      status: data.amountPaid >= grandTotal ? "Completed" : data.status,
    };

    try {
      if (editableOrder) {
        console.log("Order Updated:", orderData);
        await updateSale(editableOrder.id, orderData);
        setToast({ message: "Order updated successfully!", type: "success" });
      } else {
        console.log("Order Submitted:", orderData);
        await createSale(orderData);
        setToast({ message: "Order created successfully!", type: "success" });
      }
      // Only navigate on success
      setTimeout(() => {
        navigate("/orders");
      }, 1500);
    } catch (error: any) {
      console.error("Failed to save order:", error);
      setToast({
        message: error.message || "Failed to save order. Please try again.",
        type: "error",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/orders")}
          className="p-2 hover:bg-muted rounded-full"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">
          {editableOrder ? "Edit Order" : "New Order"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Header Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">
              Bill From (Sub-company)
            </label>
            <Select
              options={subCompanyOptions}
              value={watch("subCompanyId") || ""}
              onChange={(value) => setValue("subCompanyId", value)}
              placeholder="Select Sub-company (Default: Main Company)"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer Name</label>
            <Select
              options={customers_options}
              value={watch("customer_name")}
              onChange={(value) => {
                setValue("customer_name", value);
                const customer = customers_options?.find(
                  (c) => c.value === value,
                );
                if (customer) {
                  setValue("customer_address", customer.address || "");
                }
              }}
              placeholder="Select customer"
            />
          </div>
          <div className="space-y-2">
            <DatePicker
              label="Date"
              value={watch("date")}
              onChange={(date) => setValue("date", date)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Address</label>
            <input
              {...register("customer_address")}
              className="w-full p-2 rounded-md border border-input bg-background"
              placeholder="Customer address"
              readOnly
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Salesman</label>
            <Select
              options={salemens_options}
              value={watch("salesman_no")}
              onChange={(value) => setValue("salesman_no", value)}
              placeholder="Select salesman"
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

        {/* Items Grid */}
        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_1.5fr_0.5fr] gap-2 p-3 bg-muted/50 font-medium text-sm text-muted-foreground border-b border-border">
            <div>Item</div>
            <div className="text-right">MRP</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Free Qty</div>
            <div className="text-right">SP</div>
            <div className="text-right">Total</div>
            <div></div>
          </div>

          <div className="divide-y divide-border">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_1.5fr_0.5fr] gap-2 p-2 items-center hover:bg-muted/10"
              >
                <div>
                  <Select
                    options={inventoryItemsOptions.filter(
                      (option) =>
                        !items.some(
                          (item, i) =>
                            i !== index && item.itemId === option.value,
                        ),
                    )}
                    value={watch(`items.${index}.itemId`)}
                    onChange={(value) => {
                      setValue(`items.${index}.itemId`, value);
                      const selectedItem = inventoryItemsOptions?.find(
                        (item) => item.value === value,
                      );
                      if (selectedItem) {
                        setValue(
                          `items.${index}.unitPrice`,
                          selectedItem.unitPrice,
                        );
                        setValue(
                          `items.${index}.sellingPrice`,
                          selectedItem.price,
                        );
                        setValue(
                          `items.${index}.description`,
                          selectedItem.label,
                        );
                      }
                    }}
                    placeholder="Select Item"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.unitPrice` as const, {
                      valueAsNumber: true,
                    })}
                    className="w-full p-1.5 rounded-md border border-input bg-background text-right text-sm"
                    readOnly
                  />
                </div>
                <div>
                  <input
                    type="number"
                    {...register(`items.${index}.quantity` as const, {
                      valueAsNumber: true,
                    })}
                    className="w-full p-1.5 rounded-md border border-input bg-background text-right text-sm"
                    min="1"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    {...register(`items.${index}.freeQty` as const, {
                      valueAsNumber: true,
                    })}
                    className="w-full p-1.5 rounded-md border border-input bg-background text-right text-sm"
                    min="0"
                    onKeyDown={(e) => handleKeyDown(e, index, "unitPrice")}
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.sellingPrice` as const, {
                      valueAsNumber: true,
                    })}
                    className="w-full p-1.5 rounded-md border border-input bg-background text-right text-sm"
                  />
                </div>
                <div className="text-right font-mono text-sm px-2 font-semibold">
                  $
                  {(
                    (items[index]?.quantity || 0) *
                    (items[index]?.sellingPrice || 0)
                  ).toFixed(2)}
                </div>
                <div className="flex justify-center">
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
                  freeQty: 0,
                  unitPrice: 0,
                  sellingPrice: 0,
                  description: "",
                })
              }
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium px-2 py-1"
            >
              <Plus size={16} /> Add Line
            </button>
          </div>
        </div>

        {/* Totals Footer */}
        <div className="flex justify-end">
          <div className="w-full md:w-1/3 bg-card p-6 rounded-xl border border-border shadow-sm space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Quantity</span>
              <span className="font-mono font-semibold">{totalQuantity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Discount</span>
              <input
                type="number"
                {...register("discount", { valueAsNumber: true })}
                className="w-24 p-1 rounded-md border border-input bg-background text-right"
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Amount Paid</span>
              <input
                type="number"
                step="0.01"
                {...register("amountPaid", { valueAsNumber: true })}
                className="w-24 p-1 rounded-md border border-input bg-background text-right"
              />
            </div>
            <div className="flex justify-between text-sm font-semibold text-primary">
              <span>Remaining Balance</span>
              <span className="font-mono">
                ${(grandTotal - (watch("amountPaid") || 0)).toFixed(2)}
              </span>
            </div>
            <div className="border-t border-border pt-4 flex justify-between font-bold text-lg">
              <span>Grand Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 flex items-center justify-center gap-2 mt-4"
            >
              <Save size={20} />
              Save Order
            </button>

            <button
              type="button"
              onClick={() => handlePrint()}
              className="w-full bg-secondary text-secondary-foreground py-2 rounded-md font-medium hover:bg-secondary/80 flex items-center justify-center gap-2 mt-2"
            >
              <Printer size={20} />
              Print Invoice
            </button>
          </div>
        </div>
      </form>

      {/* Hidden Print Component */}
      <div className="hidden">
        <InvoiceTemplate ref={componentRef} order={invoiceData} />
      </div>

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
