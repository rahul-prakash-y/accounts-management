import { useMemo, useState, useRef } from "react";
import { TrendingUp, TrendingDown, DollarSign, Download } from "lucide-react";
import { DataTable, ColumnDef } from "../components/DataTable";
import { DatePicker } from "../components/DatePicker";
import { clsx } from "clsx";
import { format, subDays } from "date-fns";
import { useReactToPrint } from "react-to-print";

// Dummy Financial Data
const REPORT_DATA = {
  sales: {
    today: 1240.5,
    week: 8450.0,
    month: 34200.0,
  },
  purchases: {
    today: 450.0,
    week: 3200.0,
    month: 15600.0,
  },
  expenses: {
    month: 4320.0,
  },
};

// Generate inventory items sales data
const generateInventorySalesData = () => {
  const items = [
    "Laptop",
    "Mouse",
    "Keyboard",
    "Monitor",
    "Headphones",
    "Webcam",
    "USB Cable",
    "HDMI Cable",
    "Desk Lamp",
    "Chair",
    "Desk",
    "Notebook",
    "Pen",
    "Marker",
    "Stapler",
  ];

  const data = [];
  for (let i = 0; i < 50; i++) {
    const date = subDays(new Date(), Math.floor(Math.random() * 60));
    const item = items[Math.floor(Math.random() * items.length)];
    const quantity = Math.floor(Math.random() * 10) + 1;
    const unitPrice = Math.floor(Math.random() * 500) + 50;

    data.push({
      id: i + 1,
      date: format(date, "yyyy-MM-dd"),
      itemName: item,
      quantity: quantity,
      unitPrice: unitPrice,
      totalAmount: quantity * unitPrice,
      customer: `Customer ${Math.floor(Math.random() * 20) + 1}`,
      orderId: `ORD-${1000 + i}`,
    });
  }
  return data.sort((a, b) => a.date.localeCompare(b.date));
};

const inventorySalesData = generateInventorySalesData();

function SummaryCard({
  title,
  amount,
  type,
}: {
  title: string;
  amount: number;
  type: "income" | "expense" | "neutral";
}) {
  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        {title}
      </h3>
      <div
        className={clsx(
          "text-2xl font-bold font-mono",
          type === "income"
            ? "text-green-600 dark:text-green-400"
            : type === "expense"
              ? "text-red-600 dark:text-red-400"
              : "text-foreground",
        )}
      >
        ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </div>
    </div>
  );
}

export default function Reports() {
  const [fromDate, setFromDate] = useState(() =>
    format(subDays(new Date(), 30), "yyyy-MM-dd"),
  );
  const [toDate, setToDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const printRef = useRef<HTMLDivElement>(null);

  // Filter inventory sales data by date range
  const filteredSales = useMemo(() => {
    return inventorySalesData.filter(
      (sale) => sale.date >= fromDate && sale.date <= toDate,
    );
  }, [fromDate, toDate]);

  // Group sales by item and calculate totals
  const itemsSummary = useMemo(() => {
    const grouped = filteredSales.reduce(
      (acc, sale) => {
        if (!acc[sale.itemName]) {
          acc[sale.itemName] = {
            itemName: sale.itemName,
            totalQuantity: 0,
            totalSales: 0,
            salesCount: 0,
          };
        }
        acc[sale.itemName].totalQuantity += sale.quantity;
        acc[sale.itemName].totalSales += sale.totalAmount;
        acc[sale.itemName].salesCount += 1;
        return acc;
      },
      {} as Record<
        string,
        {
          itemName: string;
          totalQuantity: number;
          totalSales: number;
          salesCount: number;
        }
      >,
    );

    return Object.values(grouped).sort((a, b) => b.totalSales - a.totalSales);
  }, [filteredSales]);

  // Print/Download PDF function
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `inventory_sales_report_${fromDate}_to_${toDate}`,
  });

  const columns = useMemo<ColumnDef<(typeof itemsSummary)[0]>[]>(
    () => [
      {
        header: "Item Name",
        accessorKey: "itemName",
        className: "flex-[3] font-medium",
      },
      {
        header: "Total Quantity Sold",
        accessorKey: "totalQuantity",
        className: "flex-[2] text-center",
      },
      {
        header: "Number of Sales",
        accessorKey: "salesCount",
        className: "flex-[2] text-center text-muted-foreground",
      },
      {
        header: "Total Sales Amount",
        className: "flex-[2] text-right",
        cell: (item) => (
          <span className="font-mono font-medium text-green-600 dark:text-green-400">
            ${item.totalSales.toLocaleString()}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              From:
            </span>
            <DatePicker
              value={fromDate}
              onChange={setFromDate}
              className="w-[160px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              To:
            </span>
            <DatePicker
              value={toDate}
              onChange={setToDate}
              className="w-[160px]"
            />
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium transition-all shadow-sm shadow-primary/20"
          >
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sales Block */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <div className="p-1 rounded bg-green-100 text-green-600 dark:bg-green-900/30">
              <TrendingUp size={18} />
            </div>
            Sales Revenue
          </h3>
          <SummaryCard
            title="Today"
            amount={REPORT_DATA.sales.today}
            type="income"
          />
          <SummaryCard
            title="This Week"
            amount={REPORT_DATA.sales.week}
            type="income"
          />
          <SummaryCard
            title="This Month"
            amount={REPORT_DATA.sales.month}
            type="income"
          />
        </div>

        {/* Purchases Block */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <div className="p-1 rounded bg-orange-100 text-orange-600 dark:bg-orange-900/30">
              <TrendingDown size={18} />
            </div>
            Purchases Cost
          </h3>
          <SummaryCard
            title="Today"
            amount={REPORT_DATA.purchases.today}
            type="expense"
          />
          <SummaryCard
            title="This Week"
            amount={REPORT_DATA.purchases.week}
            type="expense"
          />
          <SummaryCard
            title="This Month"
            amount={REPORT_DATA.purchases.month}
            type="expense"
          />
        </div>

        {/* Profit & Margins Block */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <div className="p-1 rounded bg-blue-100 text-blue-600 dark:bg-blue-900/30">
              <DollarSign size={18} />
            </div>
            Profitability
          </h3>

          {/* Net Profit */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Net Profit (Month)
            </h3>
            <div className="text-2xl font-bold font-mono text-primary">
              $
              {(
                REPORT_DATA.sales.month - REPORT_DATA.purchases.month
              ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Gross Margin */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Gross Margin
            </h3>
            <div className="text-2xl font-bold font-mono text-green-600 dark:text-green-400">
              {(
                (1 - REPORT_DATA.purchases.month / REPORT_DATA.sales.month) *
                100
              ).toFixed(1)}
              %
            </div>
          </div>

          {/* Expenses */}
          <SummaryCard
            title="Expenses (Month)"
            amount={REPORT_DATA.expenses.month}
            type="expense"
          />
        </div>
      </div>

      {/* Inventory Items Sales */}
      <div className="mt-8 flex flex-col h-[500px]">
        <h3 className="font-semibold mb-4 px-1">
          Inventory Items Sales Summary
        </h3>
        <DataTable data={itemsSummary} columns={columns} />
      </div>

      {/* Hidden Print Section - Inventory Sales Report */}
      <div ref={printRef} className="hidden print:block p-8">
        <h1 className="text-2xl font-bold mb-2">Inventory Sales Report</h1>
        <p className="text-sm text-gray-600 mb-6">
          Period: {fromDate} to {toDate}
        </p>

        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="bg-blue-500 text-white">
              <th className="border border-gray-300 px-4 py-2 text-left">
                Item Name
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center">
                Total Quantity
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center">
                Sales Count
              </th>
              <th className="border border-gray-300 px-4 py-2 text-right">
                Total Sales
              </th>
            </tr>
          </thead>
          <tbody>
            {itemsSummary.map((item, index) => (
              <tr
                key={item.itemName}
                className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="border border-gray-300 px-4 py-2">
                  {item.itemName}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {item.totalQuantity}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {item.salesCount}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  ${item.totalSales.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 border-t-2 border-gray-800 pt-4">
          <p className="font-semibold text-lg">Summary</p>
          <p className="mt-2">
            Total Items Sold:{" "}
            {itemsSummary
              .reduce((sum, item) => sum + item.totalQuantity, 0)
              .toLocaleString()}
          </p>
          <p>Total Sales Transactions: {filteredSales.length}</p>
          <p className="text-xl font-bold mt-2">
            Grand Total: $
            {itemsSummary
              .reduce((sum, item) => sum + item.totalSales, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
