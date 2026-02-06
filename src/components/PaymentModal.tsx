import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Order } from "../store/orderStore";
import { DollarSign } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSubmit: (
    amount: number,
    mode: "Cash" | "UPI" | "Card" | "Net Banking",
    status: string,
  ) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<number | "">("");
  const [isFullPayment, setIsFullPayment] = useState(false);
  const [paymentMode, setPaymentMode] = useState<
    "Cash" | "UPI" | "Card" | "Net Banking"
  >("Cash");
  const [deliveryStatus, setDeliveryStatus] = useState<string>("");

  useEffect(() => {
    if (isOpen && order) {
      setAmount("");
      setIsFullPayment(false);
      setPaymentMode("Cash");
      setDeliveryStatus(order.status);
    }
  }, [isOpen, order]);

  if (!order) return null;

  const remainingAmount = order.total - (order.amountPaid || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof amount === "number" && amount > 0) {
      onSubmit(amount, paymentMode, deliveryStatus);
      onClose();
    }
  };

  const handleFullPaymentToggle = (checked: boolean) => {
    setIsFullPayment(checked);
    if (checked) {
      setAmount(remainingAmount);
      setDeliveryStatus("Completed");
    } else {
      setAmount("");
      // Reset status to previous if unchecking? Maybe keep as is.
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receive Payment - Order #${order.id}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-medium">{order.customer_name}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground mr-2">Delivery Status:</span>
            <select
              value={deliveryStatus}
              onChange={(e) => setDeliveryStatus(e.target.value)}
              className="p-1 h-8 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-xs"
            >
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Amount:</span>
            <span className="font-medium">${order.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Already Paid:</span>
            <span className="font-medium text-green-600">
              ${(order.amountPaid || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm font-medium pt-2 border-t border-border">
            <span>Remaining Balance:</span>
            <span className="text-primary">${remainingAmount.toFixed(2)}</span>
          </div>
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
              max={remainingAmount}
              value={amount}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setAmount(isNaN(val) ? "" : val);
                if (val !== remainingAmount) setIsFullPayment(false);
                if (val === remainingAmount) setIsFullPayment(true);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="fullPayment"
            checked={isFullPayment}
            onChange={(e) => handleFullPaymentToggle(e.target.checked)}
            className="rounded border-input text-primary focus:ring-primary"
          />
          <label
            htmlFor="fullPayment"
            className="text-sm cursor-pointer select-none"
          >
            Receive full remaining amount (${remainingAmount.toFixed(2)})
          </label>
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

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!amount || Number(amount) <= 0}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Payment
          </button>
        </div>
      </form>
    </Modal>
  );
};
