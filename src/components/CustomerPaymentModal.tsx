import React, { useState } from "react";
import { Modal } from "./Modal";
import { Customer } from "../store/customerStore";
import { DollarSign } from "lucide-react";

interface CustomerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSubmit: (
    amount: number,
    mode: "Cash" | "UPI" | "Card" | "Net Banking",
    description: string,
  ) => Promise<void>;
}

export const CustomerPaymentModal: React.FC<CustomerPaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<number | "">("");
  const [paymentMode, setPaymentMode] = useState<
    "Cash" | "UPI" | "Card" | "Net Banking"
  >("Cash");
  const [description, setDescription] = useState("Balance Payment");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof amount === "number" && amount > 0) {
      setIsSubmitting(true);
      try {
        await onSubmit(amount, paymentMode, description);
        setAmount("");
        setDescription("Balance Payment");
        onClose();
      } catch (error) {
        console.error("Payment failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receive Payment - ${customer.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Balance:</span>
            <span
              className={`font-medium ${customer.balance < 0 ? "text-destructive" : "text-green-600"}`}
            >
              {customer.balance < 0
                ? `-$${Math.abs(customer.balance).toFixed(2)}`
                : `$${customer.balance.toFixed(2)}`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Negative balance indicates the customer owes you money.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-sm font-medium block">Payment Amount</label>
          <div className="relative">
            <DollarSign
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setAmount(isNaN(val) ? "" : val);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="0.00"
              required
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium block">Payment Mode</label>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value as any)}
            className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Net Banking">Net Banking</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium block">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. Previous balance payment"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!amount || Number(amount) <= 0 || isSubmitting}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
