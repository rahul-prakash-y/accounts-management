import { useMemo, useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
} from "lucide-react";
import { DataTable, ColumnDef } from "../components/DataTable";
import { DatePicker } from "../components/DatePicker";
import { format, subDays } from "date-fns";
import { useTransactionStore } from "../store/transactionStore";
import { useOrderStore } from "../store/orderStore";
import { usePurchaseStore } from "../store/purchaseStore";
import { AddTransactionModal } from "../components/AddTransactionModal";
import { DeleteConfirmationModal } from "../components/DeleteConfirmationModal";

type CombinedTransaction = {
  id: string;
  type: "order" | "purchase" | "expense";
  date: string;
  description: string;
  amount: number;
  party: string;
  paymentMode?: string;
};

export default function Transactions() {
  const {
    transactions,
    fetchTransactions,
    deleteTransaction: deleteTransactionStore,
    isLoading: transactionsLoading,
  } = useTransactionStore();
  const { orders, fetchOrders, isLoading: ordersLoading } = useOrderStore();
  const {
    purchases,
    fetchPurchases,
    isLoading: purchasesLoading,
  } = usePurchaseStore();

  const isLoading = transactionsLoading || ordersLoading || purchasesLoading;

  const [filterDate, setFilterDate] = useState(() =>
    format(subDays(new Date(), 30), "yyyy-MM-dd"),
  );
  const [filterEndDate, setFilterEndDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );

  useEffect(() => {
    fetchTransactions(1, 1000, filterDate, filterEndDate);
    fetchPurchases(1, 1000, filterDate, filterEndDate);
    fetchOrders(1, 1000, filterDate, filterEndDate);
  }, [
    fetchTransactions,
    fetchPurchases,
    fetchOrders,
    filterDate,
    filterEndDate,
  ]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState<
    "all" | "order" | "purchase" | "expense"
  >("all");

  // Aggregate and Normalize Data
  const allTransactions = useMemo(() => {
    const formattedOrders: CombinedTransaction[] = orders.map((o) => ({
      id: String(o.id),
      type: "order",
      date: new Date(o.date || o.created_at || new Date())
        .toISOString()
        .split("T")[0],
      description: `Order #${o.id.substring(0, 6)}`,
      amount: o.total || 0,
      party: o.customer_name,
      paymentMode:
        o.paymentMode || (o.paymentStatus !== "Unpaid" ? "Mixed" : "Pending"),
    }));

    const formattedPurchases: CombinedTransaction[] = purchases.map((p) => ({
      id: String(p.id),
      type: "purchase",
      date: new Date(p.date).toISOString().split("T")[0],
      description: `Purchase #${String(p.id).substring(0, 6)}`,
      amount: p.totalAmount || 0, // Assuming totalAmount exists on Purchase
      party: p.supplier_name,
      paymentMode: p.paymentMode || "Cash",
    }));

    // Filter transactionStore to only show expenses (since valid orders/purchases are now from their own stores)
    // OR we can decide to treat transactionStore as a MANUAL entry log only.
    // Given the prompt "maintain expenses", likely we use transactionStore for explicit expenses.
    const formattedExpenses: CombinedTransaction[] = transactions
      .filter((t) => t.type === "expense")
      .map((t) => ({
        id: t.id,
        type: "expense",
        date: t.date,
        description: t.description,
        amount: t.amount || 0,
        party: t.category || "Expense",
        paymentMode: t.paymentMode,
      }));

    return [
      ...formattedOrders,
      ...formattedPurchases,
      ...formattedExpenses,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, purchases, transactions]);

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((txn) => {
      const typeMatch = selectedType === "all" || txn.type === selectedType;
      const dateMatch = txn.date >= filterDate && txn.date <= filterEndDate;
      const searchMatch =
        txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.party.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.id.toLowerCase().includes(searchQuery.toLowerCase());
      return typeMatch && dateMatch && searchMatch;
    });
  }, [allTransactions, selectedType, filterDate, filterEndDate, searchQuery]);

  // Calculate totals
  const totals = useMemo(() => {
    const orderTotal = filteredTransactions
      .filter((t) => t.type === "order")
      .reduce((sum, t) => sum + t.amount, 0);
    const purchaseTotal = filteredTransactions
      .filter((t) => t.type === "purchase")
      .reduce((sum, t) => sum + t.amount, 0);
    const expenseTotal = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      orders: orderTotal,
      purchases: purchaseTotal,
      expenses: expenseTotal,
      net: orderTotal - purchaseTotal - expenseTotal,
    };
  }, [filteredTransactions]);

  const columns = useMemo<ColumnDef<CombinedTransaction>[]>(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        className:
          "flex-[1.5] font-mono text-xs text-muted-foreground hidden md:block",
        cell: (txn) => `#${txn.id.substring(0, 6)}`,
      },
      {
        header: "Type",
        className: "flex-[1.5]",
        cell: (txn) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              txn.type === "order"
                ? "bg-green-100 text-green-700 dark:bg-green-100 dark:text-green-400"
                : txn.type === "purchase"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-100 dark:text-blue-400"
                  : "bg-orange-100 text-orange-700 dark:bg-orange-100 dark:text-orange-400"
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
        header: "Party / Category",
        accessorKey: "party", // Use accessorKey for sorting if needed, or maintain cell
        className: "flex-[3] text-muted-foreground truncate",
      },
      {
        header: "MOP",
        accessorKey: "paymentMode",
        className: "flex-[1.5] text-muted-foreground text-xs",
        cell: (txn) => (
          <span className="px-2 py-1 bg-muted rounded text-xs">
            {txn.paymentMode || "-"}
          </span>
        ),
      },
      {
        header: "Amount",
        className: "flex-[2] font-mono font-bold text-center",
        cell: (txn) => (
          <span
            className={
              txn.type === "order"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }
          >
            {txn.type === "order" ? "+" : "-"}$
            {(txn.amount || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        header: "Actions",
        className: "flex-[1] text-right",
        cell: (txn) =>
          txn.type === "expense" ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(txn.id);
              }}
              className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
            >
              <Trash2 size={16} />
            </button>
          ) : null,
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <div className="h-full flex flex-col space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-card border border-border rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="h-12 w-full bg-card border border-border rounded-xl animate-pulse" />
        <div className="flex-1 bg-card border border-border rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="text-primary" />
          Payments & Transactions
        </h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingUp size={16} />
            Sales (Income)
          </div>
          <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
            ${totals.orders.toLocaleString()}
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingDown size={16} />
            Purchases
          </div>
          <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
            ${totals.purchases.toLocaleString()}
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingDown size={16} />
            Expenses
          </div>
          <div className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">
            ${totals.expenses.toLocaleString()}
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <DollarSign size={16} />
            Net Flow
          </div>
          <div
            className={`text-xl md:text-2xl font-bold ${totals.net >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
          >
            ${totals.net.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-card p-3 rounded-xl border border-border">
        {/* Type Filter Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
          {(["all", "order", "purchase", "expense"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                selectedType === type
                  ? "bg-background shadow-sm text-foreground"
                  : "hover:bg-background/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}s
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-border hidden md:block"></div>

        {/* Date Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              From
            </span>
            <DatePicker
              value={filterDate}
              onChange={setFilterDate}
              className=""
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              To
            </span>
            <DatePicker
              value={filterEndDate}
              onChange={setFilterEndDate}
              className=""
            />
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 w-full md:w-auto relative min-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden">
        <DataTable data={filteredTransactions} columns={columns} />
      </div>

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteTransactionStore(deleteId);
          setDeleteId(null);
        }}
        itemName="this expense"
        itemType="Expense"
      />
    </div>
  );
}
