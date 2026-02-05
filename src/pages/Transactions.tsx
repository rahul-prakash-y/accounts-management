import { useMemo, useState } from "react";
import { Search, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { DataTable, ColumnDef } from "../components/DataTable";
import { DatePicker } from "../components/DatePicker";
import { format, subDays } from "date-fns";
import { useDataStore, TransactionType } from "../store/dataStore";

export default function Transactions() {
  const transactions = useDataStore((state) => state.transactions);

  const [selectedType, setSelectedType] = useState<TransactionType | "all">(
    "all",
  );
  const [filterDate, setFilterDate] = useState(() =>
    format(subDays(new Date(), 30), "yyyy-MM-dd"),
  );
  const [filterEndDate, setFilterEndDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const typeMatch = selectedType === "all" || txn.type === selectedType;
      const dateMatch = txn.date >= filterDate && txn.date <= filterEndDate;
      return typeMatch && dateMatch;
    });
  }, [selectedType, filterDate, filterEndDate]);

  // Calculate totals
  const totals = useMemo(() => {
    const orders = filteredTransactions
      .filter((t) => t.type === "order")
      .reduce((sum, t) => sum + t.amount, 0);
    const purchases = filteredTransactions
      .filter((t) => t.type === "purchase")
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return { orders, purchases, expenses, net: orders - purchases - expenses };
  }, [filteredTransactions]);

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        className: "flex-[1.5] font-mono text-xs text-muted-foreground",
      },
      {
        header: "Type",
        className: "flex-[1.5]",
        cell: (txn) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              txn.type === "order"
                ? "bg-green-100 text-green-700"
                : txn.type === "purchase"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-orange-100 text-orange-700"
            }`}
          >
            {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
          </span>
        ),
      },
      {
        header: "Date",
        accessorKey: "date",
        className: "flex-[2] text-muted-foreground",
      },
      {
        header: "Description",
        accessorKey: "description",
        className: "flex-[4] font-medium truncate",
      },
      {
        header: "Party",
        className: "flex-[3] text-muted-foreground",
        cell: (txn) => txn.customer || txn.supplier || txn.category || "-",
      },
      {
        header: "Amount",
        className: "flex-[2] font-mono font-bold text-right",
        cell: (txn) => (
          <span
            className={txn.type === "order" ? "text-green-600" : "text-red-600"}
          >
            {txn.type === "order" ? "+" : "-"}${txn.amount.toFixed(2)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="text-primary" />
          Transactions
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingUp size={16} />
            Orders (Income)
          </div>
          <div className="text-2xl font-bold text-green-600">
            ${totals.orders.toFixed(2)}
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingDown size={16} />
            Purchases
          </div>
          <div className="text-2xl font-bold text-red-600">
            ${totals.purchases.toFixed(2)}
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingDown size={16} />
            Expenses
          </div>
          <div className="text-2xl font-bold text-red-600">
            ${totals.expenses.toFixed(2)}
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <DollarSign size={16} />
            Net Profit
          </div>
          <div
            className={`text-2xl font-bold ${totals.net >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            ${totals.net.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Type Filter Tabs */}
        <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
          {(["all", "order", "purchase", "expense"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedType === type
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-2">
          <DatePicker
            className="flex items-center gap-x-4"
            value={filterDate}
            onChange={setFilterDate}
            label="From"
          />
          <span className="text-muted-foreground">to</span>
          <DatePicker
            className="flex items-center gap-x-4"
            value={filterEndDate}
            onChange={setFilterEndDate}
            label="To"
          />
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredTransactions}
        columns={columns}
        onRowClick={(txn) => console.log("Clicked", txn.id)}
      />
    </div>
  );
}
