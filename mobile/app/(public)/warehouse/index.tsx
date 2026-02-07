import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import {
  AlertCircle,
  Package,
  TrendingUp,
  Truck,
  ArrowRight,
  MoreVertical,
} from "lucide-react-native";
import { useEffect, useState, useMemo } from "react";
import { useInventoryStore, InventoryItem } from "@/store/inventoryStore";
import { usePurchaseStore } from "@/store/purchaseStore";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

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
  danger: "#ef4444",
  dangerBg: "#fef2f2",
  warning: "#f59e0b",
  warningBg: "#fffbeb",
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
  <View style={[styles.card, SHADOWS.small]}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
    </View>
    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardSubtext}>{subtext}</Text>
  </View>
);

export default function WarehouseDashboard() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
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

  const loadData = async () => {
    await Promise.all([fetchInventory(), fetchPurchases()]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const lowStockItems = useMemo(() => {
    return inventory.filter(
      (i: InventoryItem) => i.stock_level <= i.reorder_level,
    );
  }, [inventory]);

  const totalStock = useMemo(() => {
    return inventory.reduce((sum, item) => sum + item.stock_level, 0);
  }, [inventory]);

  const pendingPurchases = useMemo(() => {
    return purchases.filter((p) => p.status === "Pending").length;
  }, [purchases]);

  const isLoading = inventoryLoading || purchasesLoading;

  if (isLoading && !refreshing && inventory.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Warehouse</Text>
          <Text style={styles.headerSubtitle}>Inventory & Operations</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <MoreVertical size={24} color={COLORS.textPrincipal} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          <KPICard
            title="Total Stock"
            value={totalStock.toLocaleString()}
            subtext="Units in warehouse"
            icon={<Package size={20} color={COLORS.secondary} />}
            color={COLORS.secondary}
          />
          <KPICard
            title="Low Stock"
            value={lowStockItems.length}
            subtext="Items to reorder"
            icon={<AlertCircle size={20} color={COLORS.danger} />}
            color={COLORS.danger}
          />
        </View>

        <View style={styles.grid}>
          <KPICard
            title="Pending"
            value={pendingPurchases}
            subtext="Incoming shipments"
            icon={<Truck size={20} color={COLORS.primary} />}
            color={COLORS.primary}
          />
          <KPICard
            title="Items"
            value={inventory.length}
            subtext="Unique products"
            icon={<TrendingUp size={20} color="#7e22ce" />}
            color="#7e22ce"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
          <TouchableOpacity
            onPress={() => router.push("/(public)/warehouse/inventory")}
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {lowStockItems.length > 0 ? (
          <View style={styles.alertList}>
            {lowStockItems.slice(0, 4).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.alertItem, SHADOWS.small]}
                onPress={() => router.push("/(public)/warehouse/inventory")}
                activeOpacity={0.7}
              >
                <View style={styles.alertMain}>
                  <View style={styles.alertIcon}>
                    <Package size={18} color={COLORS.danger} />
                  </View>
                  <View>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                  </View>
                </View>
                <View style={styles.alertSide}>
                  <Text style={styles.stockLevel}>{item.stock_level}</Text>
                  <ArrowRight size={16} color={COLORS.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Package size={32} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.emptyText}>All stock levels are healthy!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: 0,
  },
  grid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
  },
  cardValue: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    marginBottom: 2,
  },
  cardSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  seeAllText: {
    color: COLORS.primary,
    fontFamily: "Outfit-SemiBold",
  },
  alertList: {
    gap: 12,
  },
  alertItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.dangerBg,
  },
  alertMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.dangerBg,
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: {
    fontSize: 15,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    marginBottom: 2,
  },
  itemSku: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  alertSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stockLevel: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: COLORS.danger,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    marginTop: 0,
    color: COLORS.textSecondary,
    fontSize: 15,
    fontFamily: "Outfit-Medium",
  },
});
