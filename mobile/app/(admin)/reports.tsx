import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Calendar,
  ChevronDown,
  ArrowRight,
  Package,
  BarChart3,
  PieChart as PieChartIcon,
  CreditCard,
  Download,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react-native";
import {
  format,
  subDays,
  isSameDay,
  isSameWeek,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { useOrderStore } from "@/store/orderStore";
import { usePurchaseStore } from "@/store/purchaseStore";
import { useTransactionStore } from "@/store/transactionStore";
import { LinearGradient } from "expo-linear-gradient";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";

const screenWidth = Dimensions.get("window").width;

// --- Design Tokens ---
const COLORS = {
  primary: "#4f46e5", // Indigo 600
  primaryLight: "#818cf8", // Indigo 400
  secondary: "#10b981", // Emerald 500
  secondaryLight: "#34d399", // Emerald 400
  danger: "#ef4444", // Red 500
  dangerLight: "#f87171", // Red 400
  background: "#f8fafc", // Slate 50
  cardBg: "#ffffff",
  textPrincipal: "#0f172a", // Slate 900
  textSecondary: "#64748b", // Slate 500
  border: "#e2e8f0", // Slate 200
  successBg: "#ecfdf5",
  successText: "#059669",
  dangerBg: "#fef2f2",
  dangerText: "#dc2626",
  neutralBg: "#f1f5f9",
};

const SHADOWS = {
  small: {
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};

// --- Components ---

const SummaryCard = ({
  title,
  amount,
  type,
  icon,
  trend,
  gradientParams,
}: any) => {
  const isGradient = !!gradientParams;

  const CardContent = () => (
    <>
      <View style={styles.summaryHeader}>
        <View
          style={[
            styles.iconBox,
            !isGradient && {
              backgroundColor:
                type === "income"
                  ? COLORS.successBg
                  : type === "expense"
                    ? COLORS.dangerBg
                    : COLORS.neutralBg,
            },
            isGradient && { backgroundColor: "rgba(255,255,255,0.2)" },
          ]}
        >
          {icon}
        </View>
        {trend && (
          <View
            style={[
              styles.trendBadge,
              !isGradient && {
                backgroundColor:
                  trend === "up" ? COLORS.successBg : COLORS.dangerBg,
              },
              isGradient && { backgroundColor: "rgba(255,255,255,0.2)" },
            ]}
          >
            {trend === "up" ? (
              <ArrowUpRight
                size={14}
                color={isGradient ? "white" : COLORS.successText}
              />
            ) : (
              <ArrowDownRight
                size={14}
                color={isGradient ? "white" : COLORS.dangerText}
              />
            )}
            <Text
              style={[
                styles.trendText,
                !isGradient && {
                  color:
                    trend === "up" ? COLORS.successText : COLORS.dangerText,
                },
                isGradient && { color: "white" },
              ]}
            >
              {trend === "up" ? "+12%" : "-5%"}
            </Text>
          </View>
        )}
      </View>
      <View>
        <Text
          style={[
            styles.summaryTitle,
            isGradient && { color: "rgba(255,255,255,0.8)" },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.summaryValue,
            !isGradient && {
              color:
                type === "income"
                  ? COLORS.successText
                  : type === "expense"
                    ? COLORS.dangerText
                    : COLORS.textPrincipal,
            },
            isGradient && { color: "white" },
          ]}
        >
          ₹{amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
        </Text>
      </View>
    </>
  );

  if (isGradient) {
    return (
      <LinearGradient
        colors={gradientParams.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.summaryCard, SHADOWS.medium, { borderWidth: 0 }]}
      >
        <CardContent />
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.summaryCard, SHADOWS.small]}>
      <CardContent />
    </View>
  );
};

export default function ReportsScreen() {
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">(
    "month",
  );
  const [refreshing, setRefreshing] = useState(false);

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

  const { fromDate, toDate } = useMemo(() => {
    const today = new Date();
    // Normalize to start/end of day to avoid second/millisecond differences
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    let start = new Date(today);
    if (dateRange === "week") start = subDays(today, 7);
    else if (dateRange === "month") start = subDays(today, 30);
    else start = subDays(today, 365);
    start.setHours(0, 0, 0, 0);

    return { fromDate: start, toDate: end };
  }, [dateRange]);

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        fetchOrders(
          1,
          1000,
          format(fromDate, "yyyy-MM-dd"),
          format(toDate, "yyyy-MM-dd"),
        ),
        fetchPurchases(
          1,
          1000,
          format(fromDate, "yyyy-MM-dd"),
          format(toDate, "yyyy-MM-dd"),
        ),
        fetchTransactions(
          1,
          1000,
          format(fromDate, "yyyy-MM-dd"),
          format(toDate, "yyyy-MM-dd"),
        ),
      ]);
    } catch (e) {
      console.error("Error loading report data:", e);
    }
  }, [fromDate, toDate, fetchOrders, fetchPurchases, fetchTransactions]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const isLoading = ordersLoading || purchasesLoading || transactionsLoading;

  // --- Financial Calculations ---
  const totals = useMemo(() => {
    const sum = (items: any[]) =>
      items.reduce((acc, item) => acc + (item.total || 0), 0);
    const sumExpenses = (items: any[]) =>
      items.reduce((acc, item) => {
        if (item.type === "expense") return acc + (item.amount || 0);
        return acc;
      }, 0);

    return {
      sales: sum(orders),
      purchases: sum(purchases),
      expenses: sumExpenses(transactions),
    };
  }, [orders, purchases, transactions]);

  // --- Chart Data Preparation ---
  const chartData = useMemo(() => {
    if (orders.length === 0) return [];

    const days = eachDayOfInterval({ start: fromDate, end: toDate });
    // Take last 7 days for bar chart to keep it readable, or group by weeks if longer
    const displayDays = days.slice(-7);

    return displayDays.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayOrders = orders.filter((o) =>
        (o.date || o.created_at || "").startsWith(dateStr),
      );
      const daySales = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      return {
        value: daySales,
        label: format(day, "dd/MM"),
        frontColor: COLORS.primary,
        gradientColor: COLORS.primaryLight,
        topLabelComponent: () => (
          <Text
            style={{
              fontSize: 10,
              color: COLORS.textSecondary,
              marginBottom: 4,
            }}
          >
            {daySales > 0 ? (daySales / 1000).toFixed(1) + "k" : ""}
          </Text>
        ),
      };
    });
  }, [orders, fromDate, toDate]);

  // --- Item Wise Summary ---
  const itemSummary = useMemo(() => {
    const grouped: Record<string, { name: string; qty: number; amt: number }> =
      {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const name = item.description || "Unknown Item";
        if (!grouped[name]) {
          grouped[name] = { name, qty: 0, amt: 0 };
        }
        grouped[name].qty += item.quantity;
        grouped[name].amt += (item.sellingPrice || 0) * item.quantity;
      });
    });

    return Object.values(grouped)
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 5);
  }, [orders]);

  if (isLoading && !refreshing && orders.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Analyzing Data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Overview</Text>
            <Text style={styles.headerSubtitle}>
              Make smart decisions with real-time insights
            </Text>
          </View>
          <TouchableOpacity style={[styles.exportBtn, SHADOWS.small]}>
            <Download size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Date Filter Tabs */}
        <View style={styles.filterWrapper}>
          <View style={styles.filterContainer}>
            {(["week", "month", "year"] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.filterTab,
                  dateRange === range && styles.filterTabActive,
                ]}
                onPress={() => setDateRange(range)}
              >
                <Text
                  style={[
                    styles.filterText,
                    dateRange === range && styles.filterTextActive,
                  ]}
                >
                  {range === "week"
                    ? "This Week"
                    : range === "month"
                      ? "This Month"
                      : "This Year"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dashboard Grid */}
        <View style={styles.grid}>
          <SummaryCard
            title="Net Profit"
            amount={totals.sales - totals.purchases - totals.expenses}
            type="net"
            icon={<Wallet size={24} color="white" />}
            trend="up"
            gradientParams={{ colors: ["#4f46e5", "#818cf8"] }}
          />

          <SummaryCard
            title="Total Sales"
            amount={totals.sales}
            type="income"
            trend="up"
            icon={<TrendingUp size={24} color="#10b981" />}
          />
          <SummaryCard
            title="Total Purchases"
            amount={totals.purchases}
            type="expense"
            trend="down"
            icon={<Package size={24} color="#ef4444" />} // Changed Icon
          />
          <SummaryCard
            title="Expenses"
            amount={totals.expenses}
            type="expense"
            icon={<CreditCard size={24} color="#ef4444" />}
          />
        </View>

        {/* Sales Chart */}
        <View style={[styles.chartCard, SHADOWS.medium]}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleContainer}>
              <View style={styles.chartIconBg}>
                <BarChart3 size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.chartTitle}>Revenue Trend</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Last 7 Days</Text>
            </View>
          </View>

          <View style={{ alignItems: "center", marginTop: 20 }}>
            {chartData.length > 0 ? (
              <BarChart
                data={chartData}
                barWidth={28}
                noOfSections={4}
                barBorderRadius={6}
                frontColor={COLORS.primary}
                yAxisThickness={0}
                xAxisThickness={0}
                xAxisLabelTextStyle={{
                  color: COLORS.textSecondary,
                  fontSize: 11,
                }}
                yAxisTextStyle={{ color: COLORS.textSecondary, fontSize: 11 }}
                hideRules
                height={220}
                width={screenWidth - 84}
                isAnimated
                showGradient
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No sales data available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Top Items List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Perfoming Products</Text>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Text style={styles.sectionAction}>See All</Text>
            <ArrowRight
              size={14}
              color={COLORS.primary}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.itemsCard, SHADOWS.small]}>
          {itemSummary.map((item, index) => (
            <View
              key={index}
              style={[
                styles.itemRow,
                index === itemSummary.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <LinearGradient
                colors={
                  index < 3 ? ["#4f46e5", "#818cf8"] : ["#f1f5f9", "#f1f5f9"]
                }
                style={styles.rankingCircle}
              >
                <Text
                  style={[
                    styles.rankingText,
                    index < 3
                      ? { color: "white" }
                      : { color: COLORS.textSecondary },
                  ]}
                >
                  {index + 1}
                </Text>
              </LinearGradient>

              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.itemMetaContainer}>
                  <Package
                    size={12}
                    color={COLORS.textSecondary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.itemQty}>{item.qty} sold</Text>
                </View>
              </View>

              <View style={styles.itemPrice}>
                <Text style={styles.itemAmt}>₹{item.amt.toLocaleString()}</Text>
                {index === 0 && (
                  <View style={styles.topBadge}>
                    <Text style={styles.topBadgeText}>Top</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
          {itemSummary.length === 0 && (
            <Text style={styles.emptyText}>No sales data for this period</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },
  exportBtn: {
    width: 44,
    height: 44,
    backgroundColor: "white",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterWrapper: {
    marginBottom: 24,
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: "white",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  summaryCard: {
    width: (Dimensions.get("window").width - 40 - 12) / 2,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 11,
    fontFamily: "Outfit-Bold",
  },
  summaryTitle: {
    fontSize: 13,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 22,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    letterSpacing: -0.5,
  },

  chartCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  chartTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chartIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#eff6ff", // blue-50
    justifyContent: "center",
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 17,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  badge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textSecondary,
  },
  noDataContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  sectionAction: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: "Outfit-SemiBold",
  },

  itemsCard: {
    backgroundColor: "white",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  rankingCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  rankingText: {
    fontSize: 13,
    fontFamily: "Outfit-Bold",
  },
  itemInfo: {
    flex: 1,
  },
  itemMetaContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemName: {
    fontSize: 15,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textPrincipal,
    marginBottom: 4,
  },
  itemQty: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  itemPrice: {
    alignItems: "flex-end",
  },
  itemAmt: {
    fontSize: 15,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  topBadge: {
    marginTop: 2,
    backgroundColor: "#fffbeb", // amber-50
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#fcd34d", // amber-300
  },
  topBadgeText: {
    fontSize: 9,
    fontFamily: "Outfit-Bold",
    color: "#b45309", // amber-700
  },
  emptyText: {
    padding: 24,
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
