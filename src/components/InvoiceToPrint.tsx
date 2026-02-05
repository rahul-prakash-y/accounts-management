import React from "react";
import { useDataStore } from "../store/dataStore";

export type InvoiceData = {
  id: string;
  date: string;
  customerName: string;
  customerAddress?: string;
  salesmanNo?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  subCompanyId?: string;
};

export const InvoiceToPrint = React.forwardRef<
  HTMLDivElement,
  { data: InvoiceData }
>((props, ref) => {
  const { data } = props;
  const companySettings = useDataStore((state) => state.companySettings);
  const subCompanies = useDataStore((state) => state.subCompanies);

  const subCompany = data.subCompanyId
    ? subCompanies.find((sc) => sc.id === data.subCompanyId)
    : null;

  const details = subCompany || companySettings;

  return (
    <div
      ref={ref}
      className="p-8 max-w-[210mm] mx-auto bg-white text-black font-sans text-sm"
    >
      {/* Header Grid */}
      <div className="flex justify-between items-start mb-12 border-b pb-8 gap-8">
        {/* Company Info (Left) */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-800 mb-4">
            Invoice
          </h1>
          <p className="font-semibold text-lg">
            {details?.name || "Your Company Name"}
          </p>
          <p className="text-gray-600">
            {details?.address || "123 Business Street"}
          </p>
          <p className="text-gray-600">
            {details?.city || "City, State 12345"}
          </p>
          <p className="text-gray-600">
            Phone: {details?.phone || "(555) 123-4567"}
          </p>
          {details?.gstNo && (
            <p className="text-gray-600 text-xs mt-1">GSTIN: {details.gstNo}</p>
          )}
        </div>

        {/* Bill To (Middle/Right) */}
        <div className="flex-1">
          <h3 className="text-gray-500 uppercase text-xs font-bold mb-2 pt-1">
            Bill To
          </h3>
          <p className="font-medium text-lg text-gray-800">
            {data.customerName}
          </p>
          <p className="text-gray-600 whitespace-pre-line leading-relaxed">
            {data.customerAddress || "No Address Provided"}
          </p>
        </div>

        {/* Invoice Meta (Right) */}
        <div className="flex-1 text-right">
          <div className="mb-4">
            <p className="text-xs uppercase font-bold text-gray-500 mb-1">
              Invoice #
            </p>
            <p className="font-bold text-xl">{data.id}</p>
          </div>

          <div className="mb-4">
            <p className="text-xs uppercase font-bold text-gray-500 mb-1">
              Date
            </p>
            <p className="font-medium">{data.date}</p>
          </div>

          <div>
            <p className="text-xs uppercase font-bold text-gray-500 mb-1">
              Salesman
            </p>
            <p className="font-medium">{data.salesmanNo || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-300">
            <th className="py-2 px-4 text-left font-semibold uppercase text-xs text-gray-600">
              Description
            </th>
            <th className="py-2 px-4 text-center font-semibold uppercase text-xs text-gray-600">
              Qty
            </th>
            <th className="py-2 px-4 text-right font-semibold uppercase text-xs text-gray-600">
              Unit Price
            </th>
            <th className="py-2 px-4 text-right font-semibold uppercase text-xs text-gray-600">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="py-3 px-4">{item.description}</td>
              <td className="py-3 px-4 text-center">{item.quantity}</td>
              <td className="py-3 px-4 text-right">
                ${item.unitPrice.toFixed(2)}
              </td>
              <td className="py-3 px-4 text-right font-medium">
                ${item.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-1/3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">${data.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Discount</span>
            <span className="text-red-500">-${data.discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-gray-800 mt-2">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-lg">
              ${data.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t pt-4 text-center text-gray-500 text-xs">
        <p>Thank you for your business!</p>
        <p>Terms: Payment due upon receipt.</p>
      </div>
    </div>
  );
});

InvoiceToPrint.displayName = "InvoiceToPrint";
