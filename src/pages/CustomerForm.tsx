import { useForm } from "react-hook-form";
import { Save, ArrowLeft, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomerStore } from "../store/customerStore";
import { Toast } from "../components/Toast";
import { useState } from "react";
import { clsx } from "clsx";

type CustomerFormValues = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  balance: number;
  status: string;
};

export default function CustomerForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const createCustomer = useCustomerStore((state) => state.addCustomer);
  const updateCustomer = useCustomerStore((state) => state.updateCustomer);
  const customers = useCustomerStore((state) => state.customers);

  const editableCustomer = customers.find((c) => c.id === id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    defaultValues: {
      id: editableCustomer?.id || "",
      name: editableCustomer?.name || "",
      email: editableCustomer?.email || "",
      phone: editableCustomer?.phone || "",
      address: editableCustomer?.address || "",
      balance: editableCustomer?.balance || 0,
      status: editableCustomer?.status || "Active",
    },
  });

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const onSubmit = async (data: CustomerFormValues) => {
    try {
      if (editableCustomer) {
        console.log("Customer Updated:", data);
        await updateCustomer(editableCustomer.id, data);
        setToast({
          message: "Customer updated successfully!",
          type: "success",
        });
      } else {
        console.log("Customer Created:", data);
        await createCustomer({
          ...data,
          status: "Active",
        });
        setToast({
          message: "Customer created successfully!",
          type: "success",
        });
      }
      setTimeout(() => {
        navigate("/customers");
      }, 1000);
    } catch (error: any) {
      console.error("Failed to save customer:", error);
      setToast({
        message: "Failed to save customer. Please try again.",
        type: "error",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/customers")}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <Users className="text-primary" size={24} />
          <h1 className="text-2xl font-bold">
            {editableCustomer ? "Edit Customer" : "New Customer"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer Full Name</label>
            <input
              {...register("name", { required: "Customer name is required" })}
              className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="e.g. John Doe"
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <input
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <input
                {...register("phone")}
                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <textarea
              {...register("address")}
              className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[80px]"
              placeholder="Customer's billing/shipping address..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Initial Balance ($)</label>
            <input
              type="number"
              step="0.01"
              {...register("balance", { valueAsNumber: true })}
              className={clsx(
                "w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono",
                (editableCustomer?.balance ?? 0) < 0
                  ? "text-destructive"
                  : "text-green-600",
              )}
            />
            <p className="text-xs text-muted-foreground italic">
              Negative (Red): Customer owes you. Positive (Green): Customer has
              credit.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/customers")}
            className="px-6 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
          >
            <Save size={18} />
            Save Customer
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
