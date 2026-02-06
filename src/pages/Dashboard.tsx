import { useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, AlertCircle, Package } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { clsx } from "clsx";
import { useOrderStore } from "../store/orderStore";
import { useInventoryStore } from "../store/inventoryStore";
import { usePurchaseStore } from "../store/purchaseStore";
import { useTransactionStore } from "../store/transactionStore";
import { format, isSameDay, subDays, startOfMonth, isAfter } from "date-fns";

function KPICard({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  subtext: string;
  icon: any;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="p-2 bg-primary/10 rounded-full text-primary">
          <Icon size={20} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-3xl font-bold">{value}</span>
        <p
          className={clsx(
            "text-xs font-medium flex items-center gap-1",
            trend === "up"
              ? "text-green-500"
              : trend === "down"
                ? "text-red-500"
                : "text-muted-foreground",
          )}
        >
          {trend === "up" && <TrendingUp size={14} />}
          {trend === "down" && <TrendingDown size={14} />}
          {subtext}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { orders, fetchOrders, isLoading: ordersLoading } = useOrderStore();
  const {
    inventory,
    fetchInventory,
    isLoading: inventoryLoading,
  } = useInventoryStore();
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

  const isLoading =
    ordersLoading ||
    inventoryLoading ||
    purchasesLoading ||
    transactionsLoading;

  useEffect(() => {
    fetchOrders();
    fetchInventory();
    fetchPurchases();
    fetchTransactions();
  }, [fetchOrders, fetchInventory, fetchPurchases, fetchTransactions]);

  // --- Calculations ---

  const today = new Date();
  const yesterday = subDays(today, 1);
  const startOfCurrentMonth = startOfMonth(today);

  // 1. Total Revenue (Today) & Trend
  const revenueToday = orders
    .filter((o) =>
      isSameDay(new Date(o.date || o.created_at || new Date()), today),
    )
    .reduce((sum, o) => sum + o.total, 0);

  const revenueYesterday = orders
    .filter((o) =>
      isSameDay(new Date(o.date || o.created_at || new Date()), yesterday),
    )
    .reduce((sum, o) => sum + o.total, 0);

  const revenueTrend =
    revenueToday > revenueYesterday
      ? "up"
      : revenueToday < revenueYesterday
        ? "down"
        : "neutral";

  const revenueDiff = revenueToday - revenueYesterday;
  const revenueSubtext = `${revenueDiff >= 0 ? "+" : ""}$${Math.abs(revenueDiff).toFixed(2)} from yesterday`;

  // 2. Total Orders (All Time or Today?) -> UI says "Total Orders", subtext "new orders"
  // Let's show All Time Orders as value, and Today's Count as subtext
  const totalOrders = orders.length;
  const ordersToday = orders.filter((o) =>
    isSameDay(new Date(o.date || o.created_at || new Date()), today),
  ).length;

  // 3. Low Stock Items
  const lowStockItems = inventory.filter(
    (i) => i.stock_level <= i.reorder_level,
  );
  const lowStockCount = lowStockItems.length;

  // 4. Expenses (This Month)
  const expensesThisMonth = purchases
    .filter(
      (p) =>
        isAfter(new Date(p.date), startOfCurrentMonth) ||
        isSameDay(new Date(p.date), startOfCurrentMonth),
    )
    .reduce((sum, p) => sum + p.total, 0);

  const manualExpensesThisMonth = transactions
    .filter(
      (t) =>
        t.type === "expense" &&
        (isAfter(new Date(t.date), startOfCurrentMonth) ||
          isSameDay(new Date(t.date), startOfCurrentMonth)),
    )
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const expensesMonth = expensesThisMonth + manualExpensesThisMonth;

  // 5. Sales Trend Chart Data (Last 7 Days)
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayName = format(date, "EEE"); // Mon, Tue...

      const dailyTotal = orders
        .filter((o) =>
          isSameDay(new Date(o.date || o.created_at || new Date()), date),
        )
        .reduce((sum, o) => sum + o.total, 0);

      data.push({ name: dayName, total: dailyTotal });
    }
    return data;
  }, [orders]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-card h-32 rounded-xl border border-border animate-pulse shadow-sm"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 h-[400px] animate-pulse shadow-sm" />
          <div className="bg-card border border-border rounded-xl p-6 h-[400px] animate-pulse shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue (Today)"
          value={`$${revenueToday.toFixed(2)}`}
          subtext={revenueSubtext}
          icon={TrendingUp}
          trend={revenueTrend}
        />
        <KPICard
          title="Total Orders"
          value={totalOrders.toString()}
          subtext={`+${ordersToday} today`}
          icon={Package}
          trend="up"
        />
        <KPICard
          title="Low Stock Items"
          value={lowStockCount.toString()}
          subtext="Requires attention"
          icon={AlertCircle}
          trend={lowStockCount > 0 ? "down" : "neutral"}
        />
        <KPICard
          title="Expenses (This Month)"
          value={`$${expensesMonth.toFixed(2)}`}
          subtext="Month to date"
          icon={TrendingDown}
          trend="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-card border border-border rounded-xl p-6 h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold mb-4">
            Sales Trend (Last 7 Days)
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-card border border-border rounded-xl p-6 h-[400px] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Low Stock Alerts</h3>
          <div className="space-y-4">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50"
                  onClick={() =>
                    (window.location.href = `/inventory/edit/${item.id}`)
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-md bg-destructive/10 flex items-center justify-center text-destructive">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.sku}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-destructive">
                      {item.stock_level} left
                    </p>
                    <span className="text-xs text-primary hover:underline cursor-pointer">
                      Reorder
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Package size={48} className="mb-2 opacity-50" />
                <p>No low stock items!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
