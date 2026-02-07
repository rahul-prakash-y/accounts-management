import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import {
  Search,
  Calendar,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShoppingBag,
  Edit2,
  X,
} from "lucide-react-native";
import { useOrderStore, Order } from "@/store/orderStore";
import { format } from "date-fns";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

// --- Design Tokens ---
const COLORS = {
  primary: "#4f46e5", // Indigo 600
  primaryLight: "#818cf8", // Indigo 400
  secondary: "#10b981", // Emerald 500
  background: "#f8fafc", // Slate 50
  cardBg: "#ffffff",
  textPrincipal: "#0f172a", // Slate 900
  textSecondary: "#64748b", // Slate 500
  border: "#e2e8f0", // Slate 200
  successBg: "#ecfdf5",
  successText: "#059669",
  warningBg: "#fffbeb",
  warningText: "#b45309",
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
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
};

const StatusBadge = ({
  status,
  type,
}: {
  status: string;
  type: "delivery" | "payment";
}) => {
  const getColors = () => {
    if (type === "delivery") {
      return status === "Completed"
        ? {
            bg: COLORS.successBg,
            text: COLORS.successText,
            icon: <CheckCircle2 size={12} color={COLORS.successText} />,
          }
        : {
            bg: COLORS.warningBg,
            text: COLORS.warningText,
            icon: <Clock size={12} color={COLORS.warningText} />,
          };
    } else {
      if (status === "Paid")
        return {
          bg: COLORS.successBg,
          text: COLORS.successText,
          icon: <CheckCircle2 size={12} color={COLORS.successText} />,
        };
      if (status === "Partial")
        return {
          bg: "#f5f3ff",
          text: "#7c3aed",
          icon: <AlertCircle size={12} color="#7c3aed" />,
        };
      return {
        bg: COLORS.dangerBg,
        text: COLORS.dangerText,
        icon: <AlertCircle size={12} color={COLORS.dangerText} />,
      };
    }
  };

  const colors = getColors();
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      {colors.icon}
      <Text style={[styles.badgeText, { color: colors.text }]}>
        {status || "Unpaid"}
      </Text>
    </View>
  );
};

const OrderCard = ({
  order,
  onEdit,
  onDelete,
}: {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (id: string) => void;
}) => (
  <TouchableOpacity
    style={[styles.card, SHADOWS.small]}
    onPress={() => onEdit(order)}
    activeOpacity={0.7}
  >
    <View style={styles.cardHeader}>
      <View>
        <View style={styles.idBadge}>
          <Text style={styles.orderId}>
            #{order.id.substring(0, 8).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.orderDate}>
          {format(new Date(order.created_at || order.date), "dd MMM, h:mm a")}
        </Text>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.badgesCol}>
          <StatusBadge status={order.status} type="delivery" />
          <StatusBadge
            status={order.paymentStatus || "Unpaid"}
            type="payment"
          />
        </View>
      </View>
    </View>

    <View style={styles.divider} />

    <View style={styles.customerNameContainer}>
      <View style={styles.customerContainer}>
        <View style={styles.customerIcon}>
          <ShoppingBag size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.customerName}>{order.customer_name}</Text>
      </View>
      <View style={styles.statGroupRight}>
        <Text style={styles.statLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>
          ₹{order.total?.toLocaleString() || "0"}
        </Text>
      </View>
    </View>

    {/* <View style={styles.cardFooter}>
      <View style={styles.statGroup}>
        <Text style={styles.statLabel}>Items</Text>
        <Text style={styles.statValue}>{order.items?.length || 0}</Text>
      </View>
      <View style={styles.statGroupRight}>
        <Text style={styles.statLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>
          ₹{order.total?.toLocaleString() || "0"}
        </Text>
      </View>
    </View> */}

    <View style={styles.actionRow}>
      <TouchableOpacity
        onPress={() => onEdit(order)}
        style={[styles.actionBtn, { backgroundColor: "#eff6ff" }]}
      >
        <Edit2 size={16} color={COLORS.primary} />
        <Text style={[styles.actionText, { color: COLORS.primary }]}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onDelete(order.id)}
        style={[styles.actionBtn, { backgroundColor: COLORS.dangerBg }]}
      >
        <Trash2 size={16} color={COLORS.dangerText} />
        <Text style={[styles.actionText, { color: COLORS.dangerText }]}>
          Delete
        </Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

export default function WarehouseOrders() {
  const router = useRouter();
  const { orders, isLoading, fetchOrders, deleteOrder } = useOrderStore();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.id.toLowerCase().includes(search.toLowerCase()),
    );
  }, [orders, search]);

  const handleDelete = (id: string) => {
    Alert.alert("Delete Order", "Are you sure you want to delete this order?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteOrder(id);
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete order");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <Text style={styles.headerSubtitle}>Manage outbound shipments</Text>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Customer or Order ID..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={COLORS.textSecondary}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.listContainer}>
        {/* @ts-ignore */}
        <FlashList<Order>
          data={filteredOrders}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onEdit={(o) =>
                router.push({
                  pathname: "/(public)/warehouse/edit-order",
                  params: { id: o.id },
                })
              }
              onDelete={handleDelete}
            />
          )}
          keyExtractor={(item) => item.id}
          estimatedItemSize={200}
          onRefresh={onRefresh}
          refreshing={refreshing}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              {isLoading ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconBg}>
                    <ShoppingBag size={32} color={COLORS.textSecondary} />
                  </View>
                  <Text style={styles.emptyText}>No orders found</Text>
                  <Text style={styles.emptySubText}>
                    Try adjusting your search
                  </Text>
                </View>
              )}
            </View>
          )}
        />
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fabContainer, SHADOWS.medium]}
        onPress={() => router.push("/(public)/warehouse/new-order")}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: COLORS.textPrincipal,
    fontFamily: "Outfit-Medium",
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 4,
  },

  // Card
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  badgesCol: {
    gap: 6,
    alignItems: "flex-end",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontFamily: "Outfit-Bold" },

  idBadge: {
    backgroundColor: COLORS.neutralBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  orderId: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
    color: COLORS.textSecondary,
  },
  orderDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.neutralBg,
    marginBottom: 16,
  },

  customerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  customerNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  customerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
  },
  customerName: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statGroup: {
    gap: 4,
  },
  statGroupRight: {
    gap: 4,
    alignItems: "flex-end",
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 15,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  totalValue: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: COLORS.primary,
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 13,
    fontFamily: "Outfit-SemiBold",
  },

  // Empty State
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
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
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // FAB
  fabContainer: {
    position: "absolute",
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  fab: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
