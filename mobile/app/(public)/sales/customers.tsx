import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  StatusBar,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useCustomerStore, Customer } from "@/store/customerStore";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Search,
  X,
  Plus,
  User,
  MapPin,
  IndianRupee,
  MessageSquare,
  PhoneCall,
  LayoutGrid,
} from "lucide-react-native";

const COLORS = {
  primary: "#4f46e5", // Indigo 600
  primaryLight: "#818cf8", // Indigo 400
  secondary: "#10b981", // Emerald 500
  background: "#f8fafc", // Slate 50
  cardBg: "#ffffff",
  textPrincipal: "#0f172a", // Slate 900
  textSecondary: "#64748b", // Slate 500
  border: "#e2e8f0", // Slate 200
  success: "#10b981",
  successBg: "#ecfdf5",
  danger: "#ef4444",
  dangerBg: "#fef2f2",
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

const CustomerCard = ({ customer }: { customer: Customer }) => {
  const handleCall = () => {
    if (customer.phone) Linking.openURL(`tel:${customer.phone}`);
  };

  const handleWhatsApp = () => {
    if (customer.phone)
      Linking.openURL(`whatsapp://send?phone=${customer.phone}`);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <User size={20} color={COLORS.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.phone}>{customer.phone || "No phone"}</Text>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Due</Text>
          <Text
            style={[
              styles.balance,
              customer.balance > 0 && styles.negativeBalance,
            ]}
          >
            ₹{customer.balance.toLocaleString()}
          </Text>
        </View>
      </View>

      {customer.address ? (
        <View style={styles.addressContainer}>
          <MapPin size={14} color={COLORS.textSecondary} />
          <Text style={styles.address} numberOfLines={1}>
            {customer.address}
          </Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
          <PhoneCall size={16} color={COLORS.primary} />
          <Text style={styles.actionText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.whatsappBtnSidebar]}
          onPress={handleWhatsApp}
        >
          <MessageSquare size={16} color={COLORS.success} />
          <Text style={[styles.actionText, { color: COLORS.success }]}>
            WhatsApp
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function CustomersScreen() {
  const router = useRouter();
  const { customers, fetchCustomers, isLoading } = useCustomerStore();

  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search)),
    );
  }, [customers, search]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Customers</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredCustomers.length}</Text>
          </View>
        </View>
        <View style={styles.searchBar}>
          <Search
            size={20}
            color={COLORS.textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name or phone..."
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

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlashList
          data={filteredCustomers}
          renderItem={({ item }) => <CustomerCard customer={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={160}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <LayoutGrid size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No customers found</Text>
            </View>
          )}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fabContainer}
        onPress={() => router.push("/(public)/sales/new-customer")}
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
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
    color: COLORS.primary,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  phone: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
    marginTop: 2,
  },
  balanceContainer: {
    alignItems: "flex-end",
  },
  balanceLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Bold",
    textTransform: "uppercase",
  },
  balance: {
    fontSize: 15,
    fontFamily: "Outfit-Bold",
    color: COLORS.textSecondary,
  },
  negativeBalance: {
    color: COLORS.danger,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 8,
  },
  address: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 6,
    flex: 1,
    fontFamily: "Outfit-Medium",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  whatsappBtnSidebar: {
    backgroundColor: COLORS.successBg,
  },
  actionText: {
    fontSize: 13,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.primary,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textPrincipal,
    marginTop: 12,
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
