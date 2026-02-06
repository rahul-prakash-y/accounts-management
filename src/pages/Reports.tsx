import { useMemo, useState, useRef, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Download } from "lucide-react";
import { DataTable, ColumnDef } from "../components/DataTable";
import { DatePicker } from "../components/DatePicker";
import { clsx } from "clsx";
import { format, subDays, isSameDay, isSameWeek, isSameMonth } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { useOrderStore } from "../store/orderStore";
import { usePurchaseStore } from "../store/purchaseStore";
import { useTransactionStore } from "../store/transactionStore";

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

  const { orders, fetchOrders, isLoading: ordersLoading } = useOrderStore();
  const {
    purchases,
    fetchPurchases,
    isLoading: purchasesLoading,
  } = usePurchaseStore();
  const {
    transactions,
    fetchTransactions,
    isLoading: transactionsLoading,
  } = useTransactionStore();

  const isLoading = ordersLoading || purchasesLoading || transactionsLoading;

  useEffect(() => {
    // For general summary, we at least need the current month
    // For the custom report table, we need fromDate to toDate
    const startFetch =
      fromDate < format(subDays(new Date(), 31), "yyyy-MM-dd")
        ? fromDate
        : format(subDays(new Date(), 31), "yyyy-MM-dd");

    // Fetch a large enough page size for reports since we aggregate client-side for now
    // In a real high-scale app, we'd use server-side aggregation (RPC)
    fetchOrders(1, 1000, startFetch, toDate);
    fetchPurchases(1, 1000, startFetch, toDate);
    fetchTransactions(1, 1000, startFetch, toDate);
  }, [fetchOrders, fetchPurchases, fetchTransactions, fromDate, toDate]);

  // --- Financial Calculations ---
  const financialData = useMemo(() => {
    const today = new Date();

    // Helper to sum totals with safe date parsing
    const sumTotal = (items: any[], checkFn: (date: Date) => boolean) =>
      items.reduce((acc, item) => {
        const itemDate = new Date(item.date);
        return checkFn(itemDate) ? acc + item.total : acc;
      }, 0);

    const sumExpenses = (items: any[], checkFn: (date: Date) => boolean) =>
      items.reduce((acc, item) => {
        const itemDate = new Date(item.date);
        return checkFn(itemDate) && item.type === "expense"
          ? acc + item.amount
          : acc;
      }, 0);

    return {
      sales: {
        today: sumTotal(orders, (d) => isSameDay(d, today)),
        week: sumTotal(orders, (d) => isSameWeek(d, today)),
        month: sumTotal(orders, (d) => isSameMonth(d, today)),
      },
      purchases: {
        today: sumTotal(purchases, (d) => isSameDay(d, today)),
        week: sumTotal(purchases, (d) => isSameWeek(d, today)),
        month: sumTotal(purchases, (d) => isSameMonth(d, today)),
      },
      expenses: {
        month: sumExpenses(transactions, (d) => isSameMonth(d, today)),
      },
    };
  }, [orders, purchases, transactions]);

  // --- Inventory Sales Data ---

  // Filter sales items by date range
  const filteredSalesItems = useMemo(() => {
    // Flatten all items from all orders within range
    return orders
      .filter((order) => {
        const orderDate = new Date(order.date || order.created_at || new Date())
          .toISOString()
          .split("T")[0];
        return orderDate >= fromDate && orderDate <= toDate;
      })
      .flatMap((order) =>
        order.items.map((item) => ({
          itemName: item.description || "Unknown Item", // Or look up by itemId if name not preserved
          quantity: item.quantity,
          totalAmount: (item.sellingPrice || 0) * item.quantity,
          // Add other fields if needed for grouping?
        })),
      );
  }, [orders, fromDate, toDate]);

  // Group by item name
  const itemsSummary = useMemo(() => {
    const grouped = filteredSalesItems.reduce(
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
        acc[sale.itemName].salesCount += 1; // Count lines, not unique orders
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
  }, [filteredSalesItems]);

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
        className: "flex-[2] text-center",
        cell: (item) => (
          <span className="font-mono font-medium text-green-600 dark:text-green-400">
            $
            {item.totalSales.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </span>
        ),
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Financial Reports</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              <div className="h-32 bg-card border border-border rounded-xl animate-pulse" />
              <div className="h-32 bg-card border border-border rounded-xl animate-pulse" />
              <div className="h-32 bg-card border border-border rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <div className="flex items-center gap-x-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              From:
            </span>
            <DatePicker
              value={fromDate}
              onChange={(date) => {
                setFromDate(date);
                if (date > toDate) {
                  setToDate(date);
                }
              }}
              className=""
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              To:
            </span>
            <DatePicker
              value={toDate}
              onChange={(date) => {
                setToDate(date);
                if (date < fromDate) {
                  setFromDate(date);
                }
              }}
              className=""
            />
          </div>
          <button
            onClick={() => handlePrint()}
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
            <div className="p-1 rounded bg-green-100 text-green-600 dark:bg-green-100">
              <TrendingUp size={18} />
            </div>
            Sales Revenue
          </h3>
          <SummaryCard
            title="Today"
            amount={financialData.sales.today}
            type="income"
          />
          <SummaryCard
            title="This Week"
            amount={financialData.sales.week}
            type="income"
          />
          <SummaryCard
            title="This Month"
            amount={financialData.sales.month}
            type="income"
          />
        </div>

        {/* Purchases Block */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <div className="p-1 rounded bg-orange-100 text-orange-600 dark:bg-orange-100">
              <TrendingDown size={18} />
            </div>
            Purchases Cost
          </h3>
          <SummaryCard
            title="Today"
            amount={financialData.purchases.today}
            type="expense"
          />
          <SummaryCard
            title="This Week"
            amount={financialData.purchases.week}
            type="expense"
          />
          <SummaryCard
            title="This Month"
            amount={financialData.purchases.month}
            type="expense"
          />
        </div>

        {/* Profit & Margins Block */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <div className="p-1 rounded bg-blue-100 text-blue-600 dark:bg-blue-100">
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
                financialData.sales.month - financialData.purchases.month
              ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Gross Margin */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Gross Margin
            </h3>
            <div className="text-2xl font-bold font-mono text-green-600 dark:text-green-400">
              {financialData.sales.month > 0
                ? (
                    (1 -
                      financialData.purchases.month /
                        financialData.sales.month) *
                    100
                  ).toFixed(1)
                : "0.0"}
              %
            </div>
          </div>

          {/* Expenses */}
          <SummaryCard
            title="Expenses (Month)"
            amount={financialData.expenses.month}
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
          <p>Total Sales Transactions: {filteredSalesItems.length}</p>
          <p className="text-xl font-bold mt-2">
            Grand Total: $
            {itemsSummary
              .reduce((sum, item) => sum + item.totalSales, 0)
              .toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}
