import React, { useState } from "react";
import { Modal } from "./Modal";
import { useTransactionStore, Transaction } from "../store/transactionStore";
import { format } from "date-fns";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const addTransaction = useTransactionStore((state) => state.addTransaction);

  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    amount: "",
    category: "",
    paymentMode: "Cash" as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newTransaction: Transaction = {
      id: `EXP-${Date.now()}`,
      type: "expense",
      date: formData.date,
      description: formData.description,
      amount: Number(formData.amount),
      category: formData.category,
      paymentMode: formData.paymentMode,
    };

    addTransaction(newTransaction);
    onClose();

    // Reset form
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      description: "",
      amount: "",
      category: "",
      paymentMode: "Cash",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Expense">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date</label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full p-2 rounded-md border border-input bg-background"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <input
            type="text"
            required
            placeholder="e.g., Office Rent, Electricity Bill"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full p-2 rounded-md border border-input bg-background"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full p-2 rounded-md border border-input bg-background"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full p-2 rounded-md border border-input bg-background"
              required
            >
              <option value="">Select Category</option>
              <option value="Rent">Rent</option>
              <option value="Utilities">Utilities</option>
              <option value="Salaries">Salaries</option>
              <option value="Marketing">Marketing</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Travel">Travel</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Payment Mode</label>
          <select
            value={formData.paymentMode}
            onChange={(e) =>
              setFormData({ ...formData, paymentMode: e.target.value as any })
            }
            className="w-full p-2 rounded-md border border-input bg-background"
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
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Add Expense
          </button>
        </div>
      </form>
    </Modal>
  );
};
