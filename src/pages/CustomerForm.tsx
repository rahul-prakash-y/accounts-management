import React from "react";
import { useForm } from "react-hook-form";
import { Save, ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "../store/dataStore";

type CustomerFormValues = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  balance: number;
  status: string
};

export default function CustomerForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    defaultValues: {
      balance: 0,
    },
  });
  const createCustomer = useDataStore((state) => state.addCustomer);
  const customers = useDataStore((state)=> state.customers);

  const onSubmit = (data: CustomerFormValues) => {
    console.log("Customer Created:", data);
    createCustomer({
      ...data,
      id: String(customers.length + 1),
      status: "Active",
    });
    navigate("/customers");
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
          <h1 className="text-2xl font-bold">New Customer</h1>
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
              {...register("balance", { valueAsNumber: true, min: 0 })}
              className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all text-destructive font-mono"
            />
            <p className="text-xs text-muted-foreground italic">
              Positive balance indicates customer owes money.
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
    </div>
  );
}
