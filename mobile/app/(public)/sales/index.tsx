import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { useOrderStore, Order } from "@/store/orderStore";
import { useRouter } from "expo-router";
import {
  Search,
  X,
  Plus,
  ShoppingCart,
  TrendingUp,
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";

const COLORS = {
  primary: "#4f46e5", // Indigo 600
  primaryLight: "#818cf8", // Indigo 400
  secondary: "#10b981", // Emerald 500
  background: "#f8fafc", // Slate 50
  cardBg: "#ffffff",
  textPrincipal: "#0f172a", // Slate 900
  textSecondary: "#64748b", // Slate 500
  border: "#e2e8f0", // Slate 200
  danger: "#ef4444",
  dangerBg: "#fef2f2",
  warning: "#f59e0b",
  warningBg: "#fffbeb",
  success: "#10b981",
  successBg: "#ecfdf5",
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
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
};

const KPICard = ({ title, value, subtext, icon, color }: any) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={[styles.cardTitle, { fontFamily: "Outfit-SemiBold" }]}>
        {title}
      </Text>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        {icon}
      </View>
    </View>
    <Text style={[styles.cardValue, { fontFamily: "Outfit-Bold" }]}>
      {value}
    </Text>
    <Text style={[styles.cardSubtext, { fontFamily: "Outfit-Medium" }]}>
      {subtext}
    </Text>
  </View>
);

const StatusBadge = ({ status }: { status: string }) => {
  let color = COLORS.textSecondary;
  let bg = COLORS.background;
  let icon = <CheckCircle size={12} color={color} />;

  switch (status) {
    case "Pending":
      color = COLORS.warning;
      bg = COLORS.warningBg;
      icon = <AlertTriangle size={12} color={color} />;
      break;
    case "Paid":
    case "Completed":
      color = COLORS.success;
      bg = COLORS.successBg;
      icon = <CheckCircle size={12} color={color} />;
      break;
    case "Partial":
      color = COLORS.primary;
      bg = COLORS.cardBg; // Using white for partial
      icon = <Package size={12} color={color} />;
      break;
    case "Cancelled":
      color = COLORS.danger;
      bg = COLORS.dangerBg;
      icon = <AlertTriangle size={12} color={color} />;
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon}
      <Text style={[styles.badgeText, { color: color }]}>{status}</Text>
    </View>
  );
};

const OrderCard = ({ order }: { order: Order }) => {
  const router = useRouter();

  // Format date safely
  const formattedDate = order.date
    ? format(new Date(order.date), "MMM dd, yyyy")
    : "N/A";

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemCardHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.itemName} numberOfLines={1}>
            {order.customer_name}
          </Text>
          <Text style={styles.skuText}>
            #{order.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
        <StatusBadge status={order.paymentStatus || order.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.itemCardBody}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Date</Text>
          <View style={styles.dateRow}>
            <Calendar
              size={12}
              color={COLORS.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.statValueSmall}>{formattedDate}</Text>
          </View>
        </View>

        <View style={[styles.statCol, { alignItems: "center" }]}>
          <Text style={styles.statLabel}>Total Amount</Text>
          <Text style={styles.stockValue}>
            ₹{order.total?.toLocaleString() || "0"}
          </Text>
        </View>

        {/* <View style={[styles.statCol, { alignItems: "flex-end" }]}>
          Placeholder for future action button if needed, keeping layout balanced
          <View style={{ width: 40 }} />
        </View> */}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          // onPress={() => router.push(`/(public)/sales/orders/${order.id}`)} // Future detail view
        >
          <Eye size={16} color={COLORS.primary} />
          <Text style={[styles.actionText, { color: COLORS.primary }]}>
            View Details
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function SalesDashboard() {
  const router = useRouter();
  const { orders, fetchOrders, isLoading } = useOrderStore();

  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        order.id.toLowerCase().includes(search.toLowerCase()),
    );
  }, [orders, search]);

  const totalOrders = orders.length;
  // Calculate today's orders (mock logic for demo, replace with real date filter if needed)
  const todayOrders = orders.filter((o) => {
    const today = new Date().toISOString().split("T")[0];
    return o.created_at?.startsWith(today);
  }).length;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        {/* KPI Section */}
        <View style={styles.kpiContainer}>
          <KPICard
            title="Total Orders"
            value={totalOrders}
            subtext="All time"
            icon={<ShoppingCart size={20} color={COLORS.primary} />}
            color={COLORS.primary}
          />
          <KPICard
            title="Today's Sales"
            value={todayOrders}
            subtext="Orders placed today"
            icon={<TrendingUp size={20} color={COLORS.secondary} />}
            color={COLORS.secondary}
          />
        </View>

        <View style={styles.searchBar}>
          <Search
            size={20}
            color={COLORS.textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List Content */}
      <View style={styles.contentContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Recent Orders ({filteredOrders.length})
          </Text>
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          
          <FlashList
            data={filteredOrders}
            renderItem={({ item }) => <OrderCard order={item} />}
            keyExtractor={(item) => item.id}
            // @ts-ignore
            estimatedItemSize={180}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Package size={64} color={COLORS.border} />
                <Text style={styles.emptyText}>No orders found</Text>
                <Text style={styles.emptySubText}>
                  Create a new order to get started
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fabContainer}
        onPress={() => router.push("/(public)/sales/new-order")}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.fab}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Plus size={28} color="white" />
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
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  kpiContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: COLORS.textPrincipal,
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  contentContainer: {
    flex: 1,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listTitle: {
    fontSize: 14,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // KPI Card
  card: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textSecondary,
    flex: 1,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 8,
  },
  cardValue: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // Order Card (Inventory item style)
  itemCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  itemCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
  },
  itemName: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    marginBottom: 4,
  },
  skuText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    backgroundColor: "#f1f5f9",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  itemCardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  statCol: {
    // flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-SemiBold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statValueSmall: {
    fontSize: 14,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textPrincipal,
  },
  stockValue: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    color: COLORS.primary,
  },
  cardActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontFamily: "Outfit-SemiBold",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontFamily: "Outfit-Bold" },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },

  // FAB
  fabContainer: {
    position: "absolute",
    bottom: 24,
    right: 24,
    ...SHADOWS.medium,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
