import React, { useState, useEffect, useMemo } from "react";
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
  Truck, // Changed from ShoppingBag to Truck for supplier context
  X,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
} from "lucide-react-native";
import { usePurchaseStore, Purchase } from "@/store/purchaseStore";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

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

const StatusBadge = ({ status }: { status: string }) => {
  const isReceived = status === "Received";
  return (
    <View
      style={[
        styles.badge,
        isReceived
          ? { backgroundColor: COLORS.successBg }
          : { backgroundColor: COLORS.warningBg },
      ]}
    >
      {isReceived ? (
        <CheckCircle2 size={12} color={COLORS.success} />
      ) : (
        <Clock size={12} color={COLORS.warning} />
      )}
      <Text
        style={[
          styles.badgeText,
          isReceived ? { color: COLORS.success } : { color: COLORS.warning },
        ]}
      >
        {status || "Pending"}
      </Text>
    </View>
  );
};

const PurchaseCard = ({
  purchase,
  onReceive,
  onEdit,
  onDelete,
}: {
  purchase: Purchase;
  onReceive: (purchase: Purchase) => void;
  onEdit: (purchase: Purchase) => void;
  onDelete: (id: string) => void;
}) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View>
        <View style={styles.idBadge}>
          <Text style={styles.purchaseId}>
            PO #{purchase.id.substring(0, 8).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.purchaseDate}>
          {format(new Date(purchase.created_at || ""), "dd MMM, h:mm a")}
        </Text>
      </View>
      <StatusBadge status={purchase.status} />
    </View>

    <View style={styles.divider} />

    <View style={styles.supplierContainer}>
      <View style={styles.iconBox}>
        <Truck size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.supplierName} numberOfLines={1}>
        {purchase.supplier_name}
      </Text>
      <View style={styles.statGroupRight}>
        <Text style={styles.statLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>
          ₹{purchase.total?.toLocaleString() || "0"}
        </Text>
      </View>
    </View>

    {/* <View style={styles.cardFooter}>
      <View style={styles.statGroup}>
        <Text style={styles.statLabel}>Items</Text>
        <Text style={styles.statValue}>{purchase.items_count}</Text>
      </View>
      <View style={styles.statGroupRight}>
        <Text style={styles.statLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>
          ₹{purchase.total?.toLocaleString() || "0"}
        </Text>
      </View>
    </View> */}

    <View style={styles.actionRow}>
      {purchase.status !== "Received" && (
        <TouchableOpacity
          style={[styles.actionBtn, styles.primaryBtn, { flex: 1.5 }]}
          onPress={() => onReceive(purchase)}
        >
          <Text style={styles.primaryBtnText}>Mark Received</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => onEdit(purchase)}
        style={[styles.actionBtn, styles.neutralBtn]}
      >
        <Edit2 size={16} color={COLORS.primary} />
        <Text style={styles.neutralBtnText}>Edit</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onDelete(purchase.id)}
        style={[styles.actionBtn, styles.dangerBtn]}
      >
        <Trash2 size={16} color={COLORS.danger} />
        <Text style={styles.dangerBtnText}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function WarehousePurchases() {
  const router = useRouter();
  const {
    purchases,
    isLoading,
    fetchPurchases,
    updatePurchase,
    deletePurchase,
  } = usePurchaseStore();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPurchases();
    setRefreshing(false);
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter(
      (p) =>
        p.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase()),
    );
  }, [purchases, search]);

  const handleReceive = (purchase: Purchase) => {
    Alert.alert(
      "Confirm Receipt",
      `Are you sure you have received all items for Purchase #${purchase.id.substring(0, 8).toUpperCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Received",
          onPress: async () => {
            try {
              await updatePurchase(purchase.id, { status: "Received" });
              Alert.alert("Success", "Purchase marked as received.");
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to update purchase",
              );
            }
          },
        },
      ],
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Purchase",
      "Are you sure you want to delete this purchase?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePurchase(id);
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to delete purchase",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Purchases</Text>
        <Text style={styles.headerSubtitle}>Incoming Stock & Bills</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Supplier or Bill ID..."
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

      <FlashList<Purchase>
        data={filteredPurchases}
        renderItem={({ item }) => (
          <PurchaseCard
            purchase={item}
            onReceive={handleReceive}
            onEdit={(p) =>
              router.push({
                pathname: "/(public)/warehouse/edit-purchase",
                params: { id: p.id },
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
              <>
                <Truck size={64} color={COLORS.border} />
                <Text style={styles.emptyText}>No purchases found</Text>
                <Text style={styles.emptySubText}>
                  Create your first purchase entry
                </Text>
              </>
            )}
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fabContainer}
        onPress={() => router.push("/(public)/warehouse/new-purchase")}
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
    marginBottom: 4,
    letterSpacing: -0.5,
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
    height: 48,
    color: COLORS.textPrincipal,
    fontSize: 16,
    marginLeft: 10,
    fontFamily: "Outfit-Medium",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 4,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  idBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  purchaseId: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
    color: COLORS.textSecondary,
  },
  purchaseDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginBottom: 16,
  },
  supplierContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  supplierName: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
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
    marginBottom: 2,
    textTransform: "uppercase",
    fontFamily: "Outfit-Bold",
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
  primaryBtn: {
    backgroundColor: COLORS.primary,
  },
  primaryBtnText: {
    color: "white",
    fontFamily: "Outfit-Bold",
    fontSize: 13,
  },
  neutralBtn: {
    backgroundColor: "#eff6ff",
  },
  neutralBtnText: {
    color: COLORS.primary,
    fontFamily: "Outfit-SemiBold",
    fontSize: 13,
  },
  dangerBtn: {
    backgroundColor: COLORS.dangerBg,
  },
  dangerBtnText: {
    color: COLORS.danger,
    fontFamily: "Outfit-SemiBold",
    fontSize: 13,
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
