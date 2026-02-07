import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import {
  Search,
  X,
  Package,
  AlertTriangle,
  Package2,
  Edit2,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Power,
  Filter,
} from "lucide-react-native";
import { useInventoryStore, InventoryItem } from "@/store/inventoryStore";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
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

const StockBadge = ({ stock, reorder }: { stock: number; reorder: number }) => {
  if (stock <= 0) {
    return (
      <View style={[styles.badge, { backgroundColor: COLORS.dangerBg }]}>
        <AlertTriangle size={12} color={COLORS.danger} />
        <Text style={[styles.badgeText, { color: COLORS.danger }]}>
          Out of Stock
        </Text>
      </View>
    );
  }
  if (stock <= reorder) {
    return (
      <View style={[styles.badge, { backgroundColor: COLORS.warningBg }]}>
        <AlertTriangle size={12} color={COLORS.warning} />
        <Text style={[styles.badgeText, { color: COLORS.warning }]}>
          Low Stock
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: COLORS.successBg }]}>
      <Package2 size={12} color={COLORS.success} />
      <Text style={[styles.badgeText, { color: COLORS.success }]}>
        In Stock
      </Text>
    </View>
  );
};

const InventoryItemCard = ({
  item,
  onEdit,
  onDelete,
  onUpdateStock,
}: {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onUpdateStock: (item: InventoryItem) => void;
}) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.skuText}>{item.sku}</Text>
      </View>
      <StockBadge stock={item.stock_level} reorder={item.reorder_level} />
    </View>

    <View style={styles.divider} />

    <View style={styles.cardBody}>
      <View style={styles.statCol}>
        <Text style={styles.statLabel}>Price</Text>
        <Text style={styles.statValue}>₹{item.price.toLocaleString()}</Text>
        <Text style={styles.mrpText}>MRP: ₹{item.unit_price}</Text>
      </View>

      <View style={[styles.statCol, { alignItems: "center" }]}>
        <Text style={styles.statLabel}>Current Stock</Text>
        <Text
          style={[
            styles.stockValue,
            item.stock_level <= item.reorder_level && { color: COLORS.warning },
            item.stock_level <= 0 && { color: COLORS.danger },
          ]}
        >
          {item.stock_level}
        </Text>
      </View>

      <View style={[styles.statCol, { alignItems: "flex-end" }]}>
        <TouchableOpacity
          style={styles.adjustBtn}
          onPress={() => onUpdateStock(item)}
        >
          <Text style={styles.adjustBtnText}>Adjust</Text>
        </TouchableOpacity>
      </View>
    </View>

    <View style={styles.cardActions}>
      <TouchableOpacity
        style={[
          styles.actionBtn,
          { borderRightWidth: 1, borderRightColor: COLORS.border },
        ]}
        onPress={() => onEdit(item)}
      >
        <Edit2 size={16} color={COLORS.primary} />
        <Text style={[styles.actionText, { color: COLORS.primary }]}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => onDelete(item.id)}
      >
        <Trash2 size={16} color={COLORS.danger} />
        <Text style={[styles.actionText, { color: COLORS.danger }]}>
          Delete
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function WarehouseInventory() {
  const router = useRouter();
  const { signOut } = useAuthStore();
  const {
    inventory,
    isLoading,
    fetchInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
  } = useInventoryStore();

  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Product Form State
  const [form, setForm] = useState<Partial<InventoryItem>>({
    sku: "",
    name: "",
    description: "",
    unit_price: 0,
    price: 0,
    stock_level: 0,
    reorder_level: 10,
  });

  // Stock Adjustment State
  const [stockAdjustment, setStockAdjustment] = useState(0);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  };

  const filteredItems = useMemo(() => {
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()),
    );
  }, [inventory, search]);

  const handleOpenModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setForm({
        sku: item.sku,
        name: item.name,
        description: item.description,
        unit_price: item.unit_price,
        price: item.price,
        stock_level: item.stock_level,
        reorder_level: item.reorder_level,
      });
    } else {
      setEditingItem(null);
      setForm({
        sku: "",
        name: "",
        description: "",
        unit_price: 0,
        price: 0,
        stock_level: 0,
        reorder_level: 10,
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenStockModal = (item: InventoryItem) => {
    setEditingItem(item);
    setStockAdjustment(0);
    setIsStockModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.sku || !form.name) {
      Alert.alert("Error", "SKU and Name are required");
      return;
    }

    try {
      const status =
        (form.stock_level || 0) <= 0
          ? "Out of Stock"
          : (form.stock_level || 0) <= (form.reorder_level || 10)
            ? "Low Stock"
            : "In Stock";

      const payload = { ...form, status };

      if (editingItem) {
        await updateInventoryItem(editingItem.id, payload);
      } else {
        await addInventoryItem(payload as any);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save item");
    }
  };

  const handleUpdateStock = async () => {
    if (!editingItem) return;

    try {
      const newStock = editingItem.stock_level + stockAdjustment;
      const status =
        newStock <= 0
          ? "Out of Stock"
          : newStock <= editingItem.reorder_level
            ? "Low Stock"
            : "In Stock";

      await updateInventoryItem(editingItem.id, {
        stock_level: newStock,
        status,
      });
      setIsStockModalOpen(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update stock");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteInventoryItem(id);
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete item");
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Inventory</Text>
            <Text style={styles.headerSubtitle}>
              {inventory.length} Products
            </Text>
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
            placeholder="Search SKU, Name..."
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

      <FlashList<InventoryItem>
        data={filteredItems}
        renderItem={({ item }) => (
          <InventoryItemCard
            item={item}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
            onUpdateStock={handleOpenStockModal}
          />
        )}
        keyExtractor={(item) => item.id}
        estimatedItemSize={180}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <>
                <Package size={64} color={COLORS.border} />
                <Text style={styles.emptyText}>No items found</Text>
                <Text style={styles.emptySubText}>
                  Add items to manage your inventory
                </Text>
              </>
            )}
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fabContainer}
        onPress={() => handleOpenModal()}
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

      {/* Product Form Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? "Edit Product" : "New Product"}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>SKU / Code</Text>
                <TextInput
                  style={styles.input}
                  value={form.sku}
                  onChangeText={(text) => setForm({ ...form, sku: text })}
                  placeholder="PROD-1001"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Product Name</Text>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(text) => setForm({ ...form, name: text })}
                  placeholder="Enter product name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.description}
                  onChangeText={(text) =>
                    setForm({ ...form, description: text })
                  }
                  placeholder="Detailed product info..."
                  multiline
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>MRP</Text>
                  <TextInput
                    style={styles.input}
                    value={String(form.unit_price)}
                    onChangeText={(text) =>
                      setForm({ ...form, unit_price: Number(text) || 0 })
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Selling Price</Text>
                  <TextInput
                    style={styles.input}
                    value={String(form.price)}
                    onChangeText={(text) =>
                      setForm({ ...form, price: Number(text) || 0 })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Stock Level</Text>
                  <TextInput
                    style={styles.input}
                    value={String(form.stock_level)}
                    onChangeText={(text) =>
                      setForm({ ...form, stock_level: Number(text) || 0 })
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Reorder Level</Text>
                  <TextInput
                    style={styles.input}
                    value={String(form.reorder_level)}
                    onChangeText={(text) =>
                      setForm({ ...form, reorder_level: Number(text) || 0 })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal visible={isStockModalOpen} animationType="fade" transparent>
        <View style={styles.stockModalOverlay}>
          <View style={styles.stockModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adjust Stock</Text>
              <TouchableOpacity onPress={() => setIsStockModalOpen(false)}>
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {editingItem && (
              <View style={styles.stockItemInfo}>
                <Text style={styles.stockItemName}>{editingItem.name}</Text>
                <Text style={styles.stockItemSku}>{editingItem.sku}</Text>

                <View style={styles.currentStockContainer}>
                  <Text style={styles.currentStockLabel}>Current Stock</Text>
                  <Text style={styles.currentStockValue}>
                    {editingItem.stock_level}
                  </Text>
                </View>

                <View style={styles.stockControl}>
                  <TouchableOpacity
                    style={[
                      styles.stockStepBtn,
                      { backgroundColor: COLORS.dangerBg },
                    ]}
                    onPress={() => setStockAdjustment((prev) => prev - 1)}
                  >
                    <ArrowDown size={24} color={COLORS.danger} />
                  </TouchableOpacity>

                  <View style={styles.adjustmentValueContainer}>
                    <Text
                      style={[
                        styles.adjustmentValue,
                        stockAdjustment > 0 && { color: COLORS.success },
                        stockAdjustment < 0 && { color: COLORS.danger },
                      ]}
                    >
                      {stockAdjustment > 0
                        ? `+${stockAdjustment}`
                        : stockAdjustment}
                    </Text>
                    <Text style={styles.newStockPreview}>
                      New: {editingItem.stock_level + stockAdjustment}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.stockStepBtn,
                      { backgroundColor: COLORS.successBg },
                    ]}
                    onPress={() => setStockAdjustment((prev) => prev + 1)}
                  >
                    <ArrowUp size={24} color={COLORS.success} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setIsStockModalOpen(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      stockAdjustment === 0 && styles.disabledBtn,
                    ]}
                    onPress={handleUpdateStock}
                    disabled={stockAdjustment === 0}
                  >
                    <Text style={styles.saveBtnText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  cardHeader: {
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
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  mrpText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textDecorationLine: "line-through",
    marginTop: 2,
  },
  stockValue: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    color: COLORS.primary,
  },
  adjustBtn: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  adjustBtnText: {
    color: COLORS.primary,
    fontFamily: "Outfit-SemiBold",
    fontSize: 12,
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

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  modalBody: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textPrincipal,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    color: COLORS.textPrincipal,
    fontSize: 15,
    fontFamily: "Outfit-Medium",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 16,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontFamily: "Outfit-SemiBold",
  },
  saveBtn: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    ...SHADOWS.small,
  },
  saveBtnText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
  disabledBtn: {
    opacity: 0.5,
  },

  // Stock Modal
  stockModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  stockModalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    width: "100%",
    padding: 24,
    ...SHADOWS.medium,
  },
  stockItemInfo: {
    alignItems: "center",
  },
  stockItemName: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    textAlign: "center",
  },
  stockItemSku: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 4,
  },
  currentStockContainer: {
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#f8fafc",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currentStockLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-SemiBold",
    textTransform: "uppercase",
  },
  currentStockValue: {
    fontSize: 32,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  stockControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginBottom: 32,
  },
  stockStepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  adjustmentValueContainer: {
    alignItems: "center",
    minWidth: 80,
  },
  adjustmentValue: {
    fontSize: 32,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  newStockPreview: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
