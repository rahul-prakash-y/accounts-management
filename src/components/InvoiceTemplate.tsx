import { forwardRef } from "react";
import { OrderItem } from "../pages/OrderForm";
import { useDataStore } from "../store/dataStore";

interface InvoiceTemplateProps {
  order: {
    id: number;
    customer_name: string;
    date: string;
    total: number;
    status: string;
    items: OrderItem[];
  };
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ order }, ref) => {
    const companySettings = useDataStore((state) => state.companySettings);

    // Generate dummy items for the invoice
    const items = Array.from({ length: order.items.length }, (_, i) => ({
      name: `Product ${i + 1}`,
      quantity: Math.floor(Math.random() * 5) + 1,
      price: (Math.random() * 100).toFixed(2),
      total: ((Math.random() * 5 + 1) * (Math.random() * 100)).toFixed(2),
    }));

    return (
      <div ref={ref} className="p-8 bg-white text-black">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">SALES INVOICE</h1>
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">
                {companySettings?.name || "Your Company Name"}
              </p>
              <p className="text-sm">
                {companySettings?.address || "123 Business Street"}
              </p>
              <p className="text-sm">
                {companySettings?.city || "City, State 12345"}
              </p>
              <p className="text-sm">
                Phone: {companySettings?.phone || "(123) 456-7890"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm">
                <span className="font-semibold">Invoice #:</span> {order.id}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Date:</span> {order.date}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Status:</span>{" "}
                <span
                  className={
                    order.status === "Completed"
                      ? "text-green-600 font-semibold"
                      : "text-yellow-600 font-semibold"
                  }
                >
                  {order.status}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-6">
          <p className="font-semibold mb-1">Bill To:</p>
          <p className="text-sm">{order.customer_name}</p>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-400 px-4 py-2 text-left">
                Item
              </th>
              <th className="border border-gray-400 px-4 py-2 text-center">
                Quantity
              </th>
              <th className="border border-gray-400 px-4 py-2 text-right">
                Price
              </th>
              <th className="border border-gray-400 px-4 py-2 text-right">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-400 px-4 py-2">
                  {item.name}
                </td>
                <td className="border border-gray-400 px-4 py-2 text-center">
                  {item.quantity}
                </td>
                <td className="border border-gray-400 px-4 py-2 text-right">
                  ${item.price}
                </td>
                <td className="border border-gray-400 px-4 py-2 text-right">
                  ${item.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 border-t border-gray-400">
              <span className="font-semibold">Subtotal:</span>
              <span>${order.total}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-semibold">Tax (0%):</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-gray-800 font-bold text-lg">
              <span>TOTAL:</span>
              <span>${order.total}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 mt-8 pt-4 border-t border-gray-300">
          <p>Thank you for your business!</p>
          <p className="mt-2">
            For questions about this invoice, please contact us at{" "}
            {companySettings?.email || "support@yourcompany.com"}
          </p>
        </div>
      </div>
    );
  },
);

InvoiceTemplate.displayName = "InvoiceTemplate";
