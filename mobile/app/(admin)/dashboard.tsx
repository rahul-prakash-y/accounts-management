import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Wallet,
  ShoppingCart,
  AlertTriangle,
  Banknote,
  Package,
  Calendar,
  ChevronRight,
  ArrowRight,
} from "lucide-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useCallback, useMemo, useState } from "react";
import { useOrderStore, Order } from "@/store/orderStore";
import { useInventoryStore, InventoryItem } from "@/store/inventoryStore";
import { usePurchaseStore, Purchase } from "@/store/purchaseStore";
import { useTransactionStore, Transaction } from "@/store/transactionStore";
import { useAuthStore } from "@/store/authStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

// Helper for date formatting
const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getDayName = (date: Date) => {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
};

const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const subDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

const startOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const isAfter = (d1: Date, d2: Date) => d1.getTime() > d2.getTime();

// KPI Card Component
const KPICard = ({
  title,
  value,
  subtext,
  icon,
  trend,
  colors,
}: {
  title: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  trend: "up" | "down" | "neutral";
  colors: [string, string];
}) => (
  <View style={styles.cardWrapper}>
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradient}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>{icon}</View>
        {trend !== "neutral" && (
          <View style={styles.trendBadge}>
            {trend === "up" ? (
              <TrendingUp size={12} color="#fff" />
            ) : (
              <TrendingDown size={12} color="#fff" />
            )}
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardValue}>{value}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtext}>{subtext}</Text>
      </View>
    </LinearGradient>
  </View>
);

export default function AdminDashboard() {
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();

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

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchOrders(),
      fetchInventory(),
      fetchPurchases(),
      fetchTransactions(),
    ]);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const isLoading =
    ordersLoading ||
    inventoryLoading ||
    purchasesLoading ||
    transactionsLoading;

  // --- Calculations ---
  const today = useMemo(() => new Date(), []);
  const yesterday = useMemo(() => subDays(today, 1), [today]);
  const startOfCurrentMonth = useMemo(() => startOfMonth(today), [today]);

  // 1. Total Revenue (Today)
  const { revenueToday, revenueYesterday, revenueTrend, revenueDiff } =
    useMemo(() => {
      const todayRev = orders
        .filter((o: Order) =>
          isSameDay(new Date(o.date || o.created_at || new Date()), today),
        )
        .reduce((sum: number, o: Order) => sum + o.total, 0);

      const yesterdayRev = orders
        .filter((o: Order) =>
          isSameDay(new Date(o.date || o.created_at || new Date()), yesterday),
        )
        .reduce((sum: number, o: Order) => sum + o.total, 0);

      const trend: "up" | "down" | "neutral" =
        todayRev > yesterdayRev
          ? "up"
          : todayRev < yesterdayRev
            ? "down"
            : "neutral";
      const diff = todayRev - yesterdayRev;

      return {
        revenueToday: todayRev,
        revenueYesterday: yesterdayRev,
        revenueTrend: trend,
        revenueDiff: diff,
      };
    }, [orders, today, yesterday]);

  // 2. Orders (Today)
  const ordersToday = useMemo(
    () =>
      orders.filter((o: Order) =>
        isSameDay(new Date(o.date || o.created_at || new Date()), today),
      ).length,
    [orders, today],
  );

  const totalOrders = useMemo(() => orders.length, [orders]);

  // 3. Low Stock
  const lowStockItems = useMemo(() => {
    return inventory.filter(
      (i: InventoryItem) => i.stock_level <= i.reorder_level,
    );
  }, [inventory]);
  const lowStockCount = lowStockItems.length;

  // 4. Expenses (This Month)
  const totalExpenses = useMemo(() => {
    const expensesMonth = purchases
      .filter(
        (p: Purchase) =>
          isAfter(new Date(p.date), startOfCurrentMonth) ||
          isSameDay(new Date(p.date), startOfCurrentMonth),
      )
      .reduce((sum: number, p: Purchase) => sum + p.total, 0);

    const manualExp = transactions
      .filter(
        (t: Transaction) =>
          t.type === "expense" &&
          (isAfter(new Date(t.date), startOfCurrentMonth) ||
            isSameDay(new Date(t.date), startOfCurrentMonth)),
      )
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

    return expensesMonth + manualExp;
  }, [purchases, transactions, startOfCurrentMonth]);

  // 5. Chart Data (Last 7 Days)
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayName = getDayName(date);
      const dailyTotal = orders
        .filter((o: Order) =>
          isSameDay(new Date(o.date || o.created_at || new Date()), date),
        )
        .reduce((sum: number, o: Order) => sum + o.total, 0);

      data.push({ value: dailyTotal, label: dayName });
    }
    return data;
  }, [orders]);

  if (isLoading && !refreshing && orders.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting} numberOfLines={1}>
              Hello, {user?.name || user?.email?.split("@")[0] || "Admin"} 👋
            </Text>
            <Text style={styles.date}>{formatDate(today)}</Text>
          </View>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={24}
              color="#64748b"
            />
          </View>
        </View>

        {/* KPI Grid */}
        <View style={styles.grid}>
          <View style={styles.row}>
            <KPICard
              title="Today's Revenue"
              value={`₹${revenueToday.toLocaleString()}`}
              subtext={`${revenueDiff >= 0 ? "+" : ""}₹${Math.abs(revenueDiff).toLocaleString()}`}
              icon={<Banknote size={24} color="#fff" />}
              trend={revenueTrend}
              colors={["#3b82f6", "#2563eb"]}
            />
            <KPICard
              title="Today's Orders"
              value={ordersToday.toString()}
              subtext="Orders processed"
              icon={<ShoppingCart size={24} color="#fff" />}
              trend="up"
              colors={["#10b981", "#059669"]}
            />
          </View>
          <View style={styles.row}>
            <KPICard
              title="Low Stock"
              value={lowStockCount.toString()}
              subtext="Items to reorder"
              icon={<AlertTriangle size={24} color="#fff" />}
              trend={lowStockCount > 0 ? "down" : "neutral"}
              colors={["#f59e0b", "#d97706"]}
            />
            <KPICard
              title="Month Expenses"
              value={`₹${totalExpenses.toLocaleString()}`}
              subtext="Total outflow"
              icon={<Wallet size={24} color="#fff" />}
              trend="neutral"
              colors={["#8b5cf6", "#7c3aed"]}
            />
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sales Overview</Text>
        </View>
        <View style={styles.chartCard}>
          <View
            style={{
              alignItems: "center",
              overflow: "hidden",
              paddingVertical: 10,
            }}
          >
            {chartData.some((d) => d.value > 0) ? (
              <LineChart
                data={chartData}
                color="#2563eb"
                thickness={3}
                startFillColor="rgba(37, 99, 235, 0.3)"
                endFillColor="rgba(37, 99, 235, 0.01)"
                startOpacity={0.9}
                endOpacity={0.2}
                initialSpacing={20}
                noOfSections={4}
                height={200}
                width={screenWidth - 70}
                yAxisTextStyle={{ color: "#9ca3af", fontSize: 11 }}
                xAxisLabelTextStyle={{ color: "#9ca3af", fontSize: 11 }}
                hideRules
                curved
                areaChart
                hideDataPoints={false}
                dataPointsColor="#2563eb"
                dataPointsRadius={4}
              />
            ) : (
              <View
                style={{
                  height: 200,
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Text style={{ color: "#9ca3af" }}>
                  No sales data for this week
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Low Stock Alerts Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
          {lowStockItems.length > 0 && (
            <TouchableOpacity onPress={() => router.push("/(admin)/inventory")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {lowStockItems.length > 0 ? (
          <View style={styles.lowStockList}>
            {lowStockItems.slice(0, 5).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.lowStockItem}
                onPress={() => router.push("/(admin)/inventory")}
              >
                <View style={styles.lowStockLeft}>
                  <View style={styles.packageIcon}>
                    <Package size={20} color="#ef4444" />
                  </View>
                  <View>
                    <Text style={styles.lowStockName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.lowStockSku}>SKU: {item.sku}</Text>
                  </View>
                </View>
                <View style={styles.stockLevel}>
                  <Text style={styles.stockLevelText}>{item.stock_level}</Text>
                  <Text style={styles.stockLabel}>left</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Package size={32} color="#10b981" />
            </View>
            <Text style={styles.emptyText}>Everything is well stocked!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "Outfit-Medium",
  },
  headerIcon: {
    width: 44,
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  grid: {
    gap: 16,
    marginBottom: 32,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  cardWrapper: {
    flex: 1,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardGradient: {
    padding: 16,
    borderRadius: 20,
    height: 140,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  trendBadge: {
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
  },
  cardContent: {
    gap: 4,
  },
  cardValue: {
    fontSize: 22,
    fontFamily: "Outfit-Bold",
    color: "#fff",
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: "Outfit-SemiBold",
    color: "rgba(255,255,255,0.9)",
  },
  cardSubtext: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: "#0f172a",
  },
  seeAllText: {
    color: "#2563eb",
    fontSize: 14,
    fontFamily: "Outfit-SemiBold",
  },
  chartCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  lowStockList: {
    gap: 12,
  },
  lowStockItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  lowStockLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  packageIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  lowStockName: {
    fontSize: 15,
    fontFamily: "Outfit-SemiBold",
    color: "#1e293b",
  },
  lowStockSku: {
    fontSize: 13,
    color: "#64748b",
  },
  stockLevel: {
    alignItems: "flex-end",
    backgroundColor: "#fff1f2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  stockLevelText: {
    fontSize: 14,
    fontFamily: "Outfit-Bold",
    color: "#e11d48",
  },
  stockLabel: {
    fontSize: 10,
    color: "#e11d48",
    fontFamily: "Outfit-SemiBold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  emptyIcon: {
    width: 56,
    height: 56,
    backgroundColor: "#ecfdf5",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#64748b",
    fontFamily: "Outfit-Medium",
  },
});
