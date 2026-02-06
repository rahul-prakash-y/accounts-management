import { forwardRef } from "react";
import { OrderItem } from "../store/orderStore";
import { useSettingsStore } from "../store/settingsStore";

interface InvoiceTemplateProps {
  order: {
    id: number | string; // Accept string 'NEW' from OrderForm
    customer_name: string;
    customer_address?: string;
    salesman_no?: string;
    salesman_name?: string;
    date: string;
    total: number;
    status: string;
    items: OrderItem[];
    subCompanyId?: string;
    discount?: number;
  };
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ order }, ref) => {
    const companySettings = useSettingsStore((state) => state.companySettings);
    const subCompanies = useSettingsStore((state) => state.subCompanies);

    const subCompany = order.subCompanyId
      ? subCompanies.find((sc) => sc.id === order.subCompanyId)
      : null;

    const details = subCompany || companySettings;

    // Use real items from order
    const items = order.items;

    // Calculate subtotal if not explicit (optional, but safe)
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * (item.sellingPrice || 0),
      0,
    );
    const discount = order.discount || 0;

    // Calculate total quantity (Assuming Billable Qty + Free Qty)
    const totalQty = items.reduce(
      (sum, item) => sum + item.quantity + (item.freeQty || 0),
      0,
    );
    // OR if user meant just billable qty:
    // const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    // Usually "Total Qty" implies the physical count of items moved.

    return (
      <>
        <style>{`
			@media print {
				@page {
				size: A4;
				margin: 0; /* Crucial: Removes default browser margins */
				}
				body {
				margin: 0;
				padding: 0;
				}
			}
			`}</style>
        <div
          ref={ref}
          className="p-8 bg-white text-black max-w-[210mm] mx-auto min-h-[297mm]"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">SALES INVOICE</h1>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">
                  {details?.name || "Your Company Name"}
                </p>
                <p className="text-sm">
                  {details?.address || "123 Business Street"}
                </p>
                <p className="text-sm">
                  {details?.city || "City, State 12345"}
                </p>
                <p className="text-sm">
                  Phone: {details?.phone || "(123) 456-7890"}
                </p>
                {companySettings?.gstNo && (
                  <p className="text-sm font-medium mt-1">
                    GSTIN: {companySettings.gstNo}
                  </p>
                )}
              </div>
              {/* Bill To */}
              <div className="mb-6">
                <p className="font-semibold mb-1 border-b inline-block border-gray-400">
                  Bill To:
                </p>
                <p className="font-bold text-lg">{order.customer_name}</p>
                <p className="text-sm whitespace-pre-line text-gray-700">
                  {order.customer_address || "No Address Provided"}
                </p>
              </div>
              {/* Invoice Meta */}
              <div className="text-right">
                <p className="text-sm">
                  <span className="font-semibold">Invoice #:</span>{" "}
                  {order.id.toString().substring(0, 6).toUpperCase()}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Date:</span> {order.date}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Salesman:</span>{" "}
                  {order.salesman_name || order.salesman_no || "N/A"}
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

          {/* Items Table */}
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 px-4 py-2 text-left">
                  Item
                </th>
                <th className="border border-gray-400 px-4 py-2 text-center">
                  Qty
                </th>
                <th className="border border-gray-400 px-4 py-2 text-center">
                  Free
                </th>
                <th className="border border-gray-400 px-4 py-2 text-right">
                  Unit Price
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
                    {item.description || "Item"}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 text-center">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 text-center">
                    {item.freeQty || 0}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 text-right">
                    ${item.sellingPrice?.toFixed(2) || 0}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 text-right">
                    ${(item.quantity * (item?.sellingPrice || 0)).toFixed(2)}
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
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold">Total Qty:</span>
                <span>{totalQty}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between py-2 text-red-600">
                  <span className="font-semibold">Discount:</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="font-semibold">Tax (0%):</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-gray-800 font-bold text-lg">
                <span>TOTAL:</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 mt-8 pt-4 border-t border-gray-300">
            <p>Thank you for your business!</p>
            <p className="mt-2">
              For questions about this invoice, please contact us at{" "}
              {details?.email || "support@yourcompany.com"}
            </p>
          </div>
        </div>
      </>
    );
  },
);

InvoiceTemplate.displayName = "InvoiceTemplate";
