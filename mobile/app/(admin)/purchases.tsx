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
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import {
  Search,
  Trash2,
  Package,
  X,
  Plus,
  Truck,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  IndianRupee,
  MoreVertical,
} from "lucide-react-native";
import { usePurchaseStore, Purchase } from "@/store/purchaseStore";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { ErrorBanner } from "@/components/ErrorBanner";

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

const StatusBadge = ({ status }: { status: string }) => {
  let bg = COLORS.neutralBg;
  let text = COLORS.textSecondary;
  let icon = <AlertCircle size={12} color={COLORS.textSecondary} />;

  if (status === "Received") {
    bg = COLORS.successBg;
    text = COLORS.successText;
    icon = <CheckCircle2 size={12} color={COLORS.successText} />;
  } else if (status === "Pending") {
    bg = COLORS.warningBg;
    text = COLORS.warningText;
    icon = <Clock size={12} color={COLORS.warningText} />;
  } else {
    bg = COLORS.dangerBg;
    text = COLORS.dangerText;
    icon = <AlertCircle size={12} color={COLORS.dangerText} />;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon}
      <Text style={[styles.badgeText, { color: text }]}>
        {status || "Unknown"}
      </Text>
    </View>
  );
};

const PurchaseCard = ({
  purchase,
  onPress,
  onDelete,
}: {
  purchase: Purchase;
  onPress: (purchase: Purchase) => void;
  onDelete: (id: string) => void;
}) => (
  <TouchableOpacity
    style={[styles.card, SHADOWS.small]}
    onPress={() => onPress(purchase)}
    activeOpacity={0.7}
  >
    <View style={styles.cardHeader}>
      <View style={styles.supplierInfo}>
        <View style={styles.avatar}>
          <Truck size={20} color={COLORS.primary} />
        </View>
        <View>
          <Text style={styles.supplierName} numberOfLines={1}>
            {purchase.supplier_name}
          </Text>
          <Text style={styles.purchaseDate}>
            {format(
              new Date(purchase.created_at || new Date()),
              "MMM dd, yyyy",
            )}
          </Text>
        </View>
      </View>
      <StatusBadge status={purchase.status || "Received"} />
    </View>

    <View style={styles.divider} />

    <View style={styles.cardBody}>
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Items</Text>
        <Text style={styles.statValue}>{purchase.items_count}</Text>
      </View>

      <View style={styles.statItemRight}>
        <Text style={styles.statLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>
          ₹{(purchase.total || 0).toLocaleString()}
        </Text>
      </View>
    </View>

    <View style={styles.cardActions}>
      <View style={styles.purchaseIdBadge}>
        <Package size={12} color={COLORS.textSecondary} />
        <Text style={styles.purchaseIdText}>
          #{purchase.id.substring(0, 8).toUpperCase()}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onPress(purchase)}
        >
          <Eye size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.dangerBg }]}
          onPress={() => onDelete(purchase.id)}
        >
          <Trash2 size={18} color={COLORS.dangerText} />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

export default function PurchasesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const {
    purchases,
    isLoading,
    error,
    fetchPurchases,
    fetchMorePurchases,
    hasMore,
    deletePurchase,
  } = usePurchaseStore();

  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPurchases();
    setRefreshing(false);
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter(
      (purchase) =>
        purchase.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
        purchase.id.toLowerCase().includes(search.toLowerCase()),
    );
  }, [purchases, search]);

  const handleDeletePurchase = (id: string) => {
    Alert.alert(
      "Delete Purchase",
      "Are you sure you want to delete this purchase record? Stock will not be automatically reverted (manual adjustment required).",
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
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Purchases</Text>
          <Text style={styles.headerSubtitle}>Manage stock & suppliers</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <MoreVertical size={24} color={COLORS.textPrincipal} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search supplier or ID..."
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

      <ErrorBanner message={error} onRetry={() => fetchPurchases()} />

      {/* Filtered List */}
      <View style={styles.listContainer}>
        {/* @ts-ignore */}
        <FlashList<Purchase>
          data={filteredPurchases}
          renderItem={({ item }) => (
            <PurchaseCard
              purchase={item}
              onPress={(p) => console.log("Press purchase", p.id)} // TODO: Navigate to detail
              onDelete={handleDeletePurchase}
            />
          )}
          keyExtractor={(item) => item.id}
          // @ts-ignore
          estimatedItemSize={160}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={() => fetchMorePurchases()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            isLoading && !refreshing && purchases.length > 0 ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              {isLoading ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconBg}>
                    <Truck size={32} color={COLORS.textSecondary} />
                  </View>
                  <Text style={styles.emptyText}>No purchases found</Text>
                  <Text style={styles.emptySubText}>
                    Try adjusting your search terms
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
        onPress={() => router.push("/(admin)/new-purchase")}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 4,
  },

  // Card Styles
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  supplierInfo: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#e0e7ff", // Indigo 100
    justifyContent: "center",
    alignItems: "center",
  },
  supplierName: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    marginBottom: 2,
  },
  purchaseDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.neutralBg,
    marginBottom: 16,
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    gap: 4,
  },
  statItemRight: {
    gap: 4,
    alignItems: "flex-end",
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 15,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textPrincipal,
  },
  totalValue: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: COLORS.primary,
  },

  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  purchaseIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.neutralBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  purchaseIdText: {
    fontSize: 12,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.neutralBg,
    justifyContent: "center",
    alignItems: "center",
  },

  // Badge
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Outfit-Bold",
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
