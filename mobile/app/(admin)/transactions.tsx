import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  StatusBar,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useTransactionStore, Transaction } from "@/store/transactionStore";
import { useOrderStore, Order } from "@/store/orderStore";
import { usePurchaseStore, Purchase } from "@/store/purchaseStore";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Search,
  Calendar,
  IndianRupee,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Wallet,
  CreditCard,
  ShoppingBag,
} from "lucide-react-native";
import { format, subDays } from "date-fns";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import { ErrorBanner } from "@/components/ErrorBanner";

// --- Design Tokens (Consistent with Reports/Settings) ---
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
  warningBg: "#fffbeb",
  warningText: "#b45309",
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

type CombinedTransaction = {
  id: string;
  type: "order" | "purchase" | "expense";
  date: string;
  description: string;
  amount: number;
  party: string;
  paymentMode?: string;
  raw: Order | Purchase | Transaction;
};

// Summary Card Component
const StatCard = ({ title, amount, icon, color, subtitle, type }: any) => {
  const isPositive = type === "income";
  const isNet = type === "net";

  return (
    <View style={[styles.statCard, SHADOWS.small]}>
      <View style={styles.statHeader}>
        <View
          style={[
            styles.statIcon,
            {
              backgroundColor: isNet
                ? COLORS.neutralBg
                : isPositive
                  ? COLORS.successBg
                  : COLORS.dangerBg,
            },
          ]}
        >
          {icon}
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <View style={styles.statBody}>
        <Text
          style={[
            styles.statAmount,
            {
              color: isNet
                ? COLORS.textPrincipal
                : isPositive
                  ? COLORS.successText
                  : COLORS.dangerText,
            },
          ]}
        >
          ₹{amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

const TransactionItem = ({
  item,
  onDelete,
}: {
  item: CombinedTransaction;
  onDelete: (id: string) => void;
}) => {
  const isOrder = item.type === "order";
  const isPurchase = item.type === "purchase";
  const isExpense = item.type === "expense";

  let icon = <Wallet size={20} color={COLORS.textSecondary} />;
  let color = COLORS.textSecondary;
  let bg = COLORS.neutralBg;

  if (isOrder) {
    icon = <ArrowUpRight size={20} color={COLORS.successText} />;
    color = COLORS.successText;
    bg = COLORS.successBg;
  } else if (isPurchase) {
    icon = <ShoppingBag size={20} color={COLORS.primary} />;
    color = COLORS.primary;
    bg = "#e0e7ff"; // Indigo 100
  } else {
    icon = <ArrowDownRight size={20} color={COLORS.dangerText} />;
    color = COLORS.dangerText;
    bg = COLORS.dangerBg;
  }

  return (
    <View style={[styles.txItem, SHADOWS.small]}>
      <View style={styles.txLeft}>
        <View style={[styles.txIconBox, { backgroundColor: bg }]}>{icon}</View>
        <View style={styles.txInfo}>
          <Text style={styles.txDescription} numberOfLines={1}>
            {item.description}
          </Text>
          <View style={styles.txMetaRow}>
            <Text style={styles.txDate}>
              {format(new Date(item.date), "dd MMM")} ·{" "}
              {format(new Date(item.date), "h:mm a")}
            </Text>
            {item.party && (
              <>
                <View style={styles.dot} />
                <Text style={styles.txParty} numberOfLines={1}>
                  {item.party}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.txRight}>
        <Text
          style={[
            styles.txAmount,
            { color: isOrder ? COLORS.successText : COLORS.textPrincipal },
          ]}
        >
          {isOrder ? "+" : "-"}₹{item.amount.toLocaleString()}
        </Text>
        <View style={styles.txActions}>
          <Text style={styles.txMode}>{item.paymentMode || "Cash"}</Text>
          {isExpense && (
            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              style={styles.deleteBtn}
              hitSlop={8}
            >
              <Trash2 size={16} color={COLORS.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default function TransactionsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<
    "all" | "order" | "purchase" | "expense"
  >("all");
  const [filterDate, setFilterDate] = useState(() =>
    format(subDays(new Date(), 30), "yyyy-MM-dd"),
  );
  const [filterEndDate, setFilterEndDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );

  const {
    transactions,
    fetchTransactions,
    fetchMoreTransactions,
    hasMore: hasMoreTransactions,
    deleteTransaction,
    error: transactionsError,
    isLoading: transactionsLoading,
  } = useTransactionStore();
  const {
    orders,
    fetchOrders,
    fetchMoreOrders,
    hasMore: hasMoreOrders,
    isLoading: ordersLoading,
  } = useOrderStore();
  const {
    purchases,
    fetchPurchases,
    isLoading: purchasesLoading,
  } = usePurchaseStore();

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchTransactions(1, 20, filterDate, filterEndDate),
      fetchPurchases(1, 20, filterDate, filterEndDate),
      fetchOrders(1, 20, filterDate, filterEndDate),
    ]);
  }, [filterDate, filterEndDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const isLoading = transactionsLoading || ordersLoading || purchasesLoading;

  // Aggregate and Normalize Data
  const allTransactions = useMemo(() => {
    const formattedOrders: CombinedTransaction[] = orders.map((o) => ({
      id: String(o.id),
      type: "order",
      date: new Date(o.date || o.created_at || new Date()).toISOString(),
      description: `Sales Order #${o.id.substring(0, 6).toUpperCase()}`,
      amount: o.total || 0,
      party: o.customer_name,
      paymentMode: o.paymentMode || "Mixed",
      raw: o,
    }));

    const formattedPurchases: CombinedTransaction[] = purchases.map((p) => ({
      id: String(p.id),
      type: "purchase",
      date: new Date(p.date).toISOString(),
      description: `Stock Purchase #${String(p.id).substring(0, 6).toUpperCase()}`,
      amount: p.total || 0,
      party: p.supplier_name,
      paymentMode: p.paymentMode || "Cash",
      raw: p,
    }));

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
        raw: t,
      }));

    return [
      ...formattedOrders,
      ...formattedPurchases,
      ...formattedExpenses,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, purchases, transactions]);

  // Filtered List
  const filteredList = useMemo(() => {
    return allTransactions.filter(
      (t) => selectedType === "all" || t.type === selectedType,
    );
  }, [allTransactions, selectedType]);

  // Totals
  const totals = useMemo(() => {
    const income = allTransactions
      .filter((t) => t.type === "order")
      .reduce((s, t) => s + t.amount, 0);
    const purchase = allTransactions
      .filter((t) => t.type === "purchase")
      .reduce((s, t) => s + t.amount, 0);
    const expense = allTransactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return { income, purchase, expense, net: income - purchase - expense };
  }, [allTransactions]);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense record?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTransaction(id),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Transactions</Text>
          <Text style={styles.subtitle}>Track your business flow</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.filterActionBtn}>
            <Calendar size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats ScrollView */}
      <View style={styles.statsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContent}
        >
          <StatCard
            title="Net Flow"
            amount={totals.net}
            icon={<Wallet size={16} color={COLORS.textPrincipal} />}
            type="net"
            subtitle="Cash in hand"
          />
          <StatCard
            title="Income"
            amount={totals.income}
            icon={<ArrowUpRight size={16} color={COLORS.successText} />}
            type="income"
            subtitle="Total Sales"
          />
          <StatCard
            title="Purchases"
            amount={totals.purchase}
            icon={<ShoppingBag size={16} color={COLORS.primary} />}
            type="expense"
            subtitle="Stock Cost"
          />
          <StatCard
            title="Expenses"
            amount={totals.expense}
            icon={<ArrowDownRight size={16} color={COLORS.dangerText} />}
            type="expense"
            subtitle="Overheads"
          />
        </ScrollView>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {(["all", "order", "purchase", "expense"] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedType(type)}
              style={[
                styles.typeBtn,
                selectedType === type && styles.typeBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  selectedType === type && styles.typeBtnTextActive,
                ]}
              >
                {type === "all"
                  ? "All"
                  : type === "order"
                    ? "Sales"
                    : type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ErrorBanner
        message={transactionsError}
        onRetry={() => fetchTransactions(1, 20, filterDate, filterEndDate)}
      />

      {/* List Container */}
      <View style={styles.listContainer}>
        {/* @ts-ignore - FlashList typing conflict with CombinedTransaction generic */}
        <FlashList<CombinedTransaction>
          data={filteredList}
          renderItem={({ item }) => (
            <TransactionItem item={item} onDelete={handleDelete} />
          )}
          keyExtractor={(item) => item.id}
          // @ts-ignore
          estimatedItemSize={88}
          contentContainerStyle={styles.listContent}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={() => {
            if (selectedType === "all" || selectedType === "expense")
              fetchMoreTransactions();
            if (selectedType === "all" || selectedType === "order")
              fetchMoreOrders();
            // Purchases fetchMore not implemented yet, but we'll add it if needed
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            isLoading && !refreshing && filteredList.length > 0 ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              {isLoading ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
              ) : (
                <>
                  <View style={styles.emptyIconBg}>
                    <Receipt size={32} color={COLORS.textSecondary} />
                  </View>
                  <Text style={styles.emptyText}>No transactions found</Text>
                  <Text style={styles.emptySubText}>
                    Try adjusting your filters or date range
                  </Text>
                </>
              )}
            </View>
          )}
        />
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, SHADOWS.medium]}
        onPress={() => router.push("/(admin)/new-transaction")}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.danger, COLORS.dangerLight]} // Using Red for Expense usually
          style={styles.fabGradient}
        >
          <Plus size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  filterActionBtn: {
    width: 44,
    height: 44,
    backgroundColor: "white",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Stats
  statsWrapper: {
    marginBottom: 24,
  },
  statsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    width: 140,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statTitle: {
    fontSize: 12,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textSecondary,
  },
  statBody: {
    gap: 2,
  },
  statAmount: {
    fontSize: 17,
    fontFamily: "Outfit-Bold",
  },
  statSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },

  // Filters
  filterSection: {
    paddingBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  typeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeBtnActive: {
    backgroundColor: COLORS.textPrincipal,
    borderColor: COLORS.textPrincipal,
  },
  typeBtnText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-SemiBold",
  },
  typeBtnTextActive: {
    color: "white",
  },

  // List
  listContainer: {
    flex: 1,
    backgroundColor: COLORS.background, // Ensure visible separation
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for FAB
  },
  txItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  txInfo: {
    flex: 1,
  },
  txDescription: {
    fontSize: 15,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    marginBottom: 4,
  },
  txMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  txDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.border,
    marginHorizontal: 6,
  },
  txParty: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  txRight: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  txAmount: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    marginBottom: 6,
  },
  txActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  txMode: {
    fontSize: 10,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.neutralBg,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
    fontFamily: "Outfit-SemiBold",
  },
  deleteBtn: {
    padding: 4,
    backgroundColor: COLORS.dangerBg,
    borderRadius: 8,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.neutralBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});
