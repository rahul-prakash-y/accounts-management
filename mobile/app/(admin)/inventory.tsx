import React, { useState, useEffect, useMemo } from "react";
import { useInventoryStore, InventoryItem } from "@/store/inventoryStore";
import { useNavigation } from "@react-navigation/native";
import { ErrorBanner } from "@/components/ErrorBanner";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import {
  Plus,
  X,
  Search,
  Package,
  AlertTriangle,
  Edit2,
  Trash2,
  ChevronRight,
  Package2,
  Tag,
  BarChart3,
  IndianRupee,
  Minus,
  PackagePlus,
} from "lucide-react-native";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const StockBadge = ({ stock, reorder }: { stock: number; reorder: number }) => {
  if (stock <= 0) {
    return (
      <View style={[styles.badge, styles.badgeError]}>
        <View style={[styles.dot, { backgroundColor: "#ef4444" }]} />
        <Text style={[styles.badgeText, styles.textError]}>Out of Stock</Text>
      </View>
    );
  }
  if (stock <= reorder) {
    return (
      <View style={[styles.badge, styles.badgeWarning]}>
        <View style={[styles.dot, { backgroundColor: "#f59e0b" }]} />
        <Text style={[styles.badgeText, styles.textWarning]}>Low Stock</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgeSuccess]}>
      <View style={[styles.dot, { backgroundColor: "#10b981" }]} />
      <Text style={[styles.badgeText, styles.textSuccess]}>In Stock</Text>
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
      <View style={styles.skuContainer}>
        <Tag size={12} color="#64748b" />
        <Text style={styles.skuText}>{item.sku}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)}>
          <Edit2 size={16} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => onDelete(item.id)}
        >
          <Trash2 size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>

    <Text style={styles.itemName}>{item.name}</Text>
    {item.description ? (
      <Text style={styles.itemDesc} numberOfLines={2}>
        {item.description}
      </Text>
    ) : null}

    <View style={styles.divider} />

    <View style={styles.cardFooter}>
      <View style={styles.priceInfo}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>MRP</Text>
          <Text style={styles.statValue}>
            ₹{item.unit_price.toLocaleString()}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Selling</Text>
          <Text style={[styles.statValue, styles.primaryText]}>
            ₹{item.price.toLocaleString()}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.stockContainer}
        onPress={() => onUpdateStock(item)}
      >
        <View style={styles.stockInfo}>
          <Text style={styles.stockLabel}>Available</Text>
          <Text style={styles.stockValue}>{item.stock_level}</Text>
        </View>
        <StockBadge stock={item.stock_level} reorder={item.reorder_level} />
      </TouchableOpacity>
    </View>
  </View>
);

export default function InventoryScreen() {
  const navigation = useNavigation();
  const {
    inventory,
    isLoading,
    error,
    fetchInventory,
    fetchMoreInventory,
    hasMore,
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

  // Form State
  const [form, setForm] = useState<Partial<InventoryItem>>({
    sku: "",
    name: "",
    description: "",
    unit_price: 0,
    price: 0,
    stock_level: 0,
    reorder_level: 10,
  });

  // Stock Update State
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
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <Text style={styles.headerSubtitle}>Manage your products</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by SKU or Name..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94a3b8"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ErrorBanner message={error} onRetry={fetchInventory} />

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
        // @ts-ignore
        estimatedItemSize={180}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={() => fetchMoreInventory()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          isLoading && !refreshing && inventory.length > 0 ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color="#2563eb" />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#2563eb" />
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Package size={48} color="#94a3b8" />
                </View>
                <Text style={styles.emptyText}>No inventory items found</Text>
                <Text style={styles.emptySubtext}>
                  Add new products to get started
                </Text>
              </View>
            )}
          </View>
        )}
      />

      {/* Product Form Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? "Edit Product" : "New Product"}
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={styles.closeBtn}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>SKU / Code</Text>
                <View style={styles.inputContainer}>
                  <Tag size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={form.sku}
                    onChangeText={(text) => setForm({ ...form, sku: text })}
                    placeholder="e.g. PROD-1001"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Product Name</Text>
                <View style={styles.inputContainer}>
                  <Package2
                    size={18}
                    color="#64748b"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={form.name}
                    onChangeText={(text) => setForm({ ...form, name: text })}
                    placeholder="Enter product name"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <View
                  style={[
                    styles.inputContainer,
                    { height: 100, alignItems: "flex-start", paddingTop: 12 },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      { height: "100%", textAlignVertical: "top" },
                    ]}
                    value={form.description}
                    onChangeText={(text) =>
                      setForm({ ...form, description: text })
                    }
                    placeholder="Detailed product info..."
                    multiline
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>MRP</Text>
                  <View style={styles.inputContainer}>
                    <IndianRupee
                      size={16}
                      color="#64748b"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={String(form.unit_price)}
                      onChangeText={(text) =>
                        setForm({ ...form, unit_price: Number(text) || 0 })
                      }
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Selling Price</Text>
                  <View style={styles.inputContainer}>
                    <IndianRupee
                      size={16}
                      color="#64748b"
                      style={styles.inputIcon}
                    />
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
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Stock Level</Text>
                  <View style={styles.inputContainer}>
                    <BarChart3
                      size={16}
                      color="#64748b"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={String(form.stock_level)}
                      onChangeText={(text) =>
                        setForm({ ...form, stock_level: Number(text) || 0 })
                      }
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Reorder Level</Text>
                  <View style={styles.inputContainer}>
                    <AlertTriangle
                      size={16}
                      color="#64748b"
                      style={styles.inputIcon}
                    />
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
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <LinearGradient
                  colors={["#2563eb", "#1d4ed8"]}
                  style={styles.saveBtnGradient}
                >
                  <Text style={styles.saveBtnText}>Save Product</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal visible={isStockModalOpen} animationType="fade" transparent>
        <View style={styles.stockModalOverlay}>
          <View style={styles.stockModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Stock</Text>
              <TouchableOpacity
                onPress={() => setIsStockModalOpen(false)}
                style={styles.closeBtn}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {editingItem && (
              <View style={styles.stockItemInfo}>
                <Text style={styles.stockItemName}>{editingItem.name}</Text>
                <Text style={styles.stockItemSku}>{editingItem.sku}</Text>

                <View style={styles.stockControl}>
                  <TouchableOpacity
                    style={styles.stockStepBtn}
                    onPress={() => setStockAdjustment((prev) => prev - 1)}
                  >
                    <Minus size={24} color="#64748b" />
                  </TouchableOpacity>

                  <View style={styles.adjustmentValueContainer}>
                    <Text
                      style={[
                        styles.adjustmentText,
                        stockAdjustment > 0 && styles.textSuccess,
                        stockAdjustment < 0 && styles.textError,
                      ]}
                    >
                      {stockAdjustment > 0
                        ? `+${stockAdjustment}`
                        : stockAdjustment}
                    </Text>
                    <Text style={styles.newStockText}>
                      New Stock: {editingItem.stock_level + stockAdjustment}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.stockStepBtn}
                    onPress={() => setStockAdjustment((prev) => prev + 1)}
                  >
                    <Plus size={24} color="#64748b" />
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
                    style={styles.saveBtn}
                    onPress={handleUpdateStock}
                    disabled={stockAdjustment === 0}
                  >
                    <LinearGradient
                      colors={
                        stockAdjustment === 0
                          ? ["#94a3b8", "#cbd5e1"]
                          : ["#2563eb", "#1d4ed8"]
                      }
                      style={styles.saveBtnGradient}
                    >
                      <Text style={styles.saveBtnText}>Update</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.fabContainer}
        onPress={() => handleOpenModal()}
        activeOpacity={0.8}
      >
        <LinearGradient colors={["#2563eb", "#1d4ed8"]} style={styles.fab}>
          <PackagePlus size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: "white",
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Outfit-Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "Outfit-Medium",
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#1e293b",
    fontFamily: "Outfit-Medium",
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  skuContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skuText: {
    fontSize: 12,
    fontFamily: "Outfit-SemiBold",
    color: "#475569",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  deleteBtn: {
    backgroundColor: "#fef2f2",
    borderColor: "#fee2e2",
  },
  itemName: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: "#1e293b",
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  itemDesc: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
    paddingHorizontal: 16,
    lineHeight: 20,
    fontFamily: "Outfit-Regular",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 12,
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceInfo: {
    gap: 4,
  },
  stockContainer: {
    alignItems: "flex-end",
    gap: 6,
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  stockLabel: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Outfit-Medium",
  },
  stockValue: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: "#1e293b",
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "Outfit-SemiBold",
    textTransform: "uppercase",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 15,
    color: "#1e293b",
    fontFamily: "Outfit-SemiBold",
  },
  primaryText: {
    color: "#2563eb",
    fontFamily: "Outfit-Bold",
  },
  boldText: {
    fontSize: 18,
    color: "#1e293b",
    fontFamily: "Outfit-Bold",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeSuccess: { backgroundColor: "#ecfdf5" },
  badgeWarning: { backgroundColor: "#fffbeb" },
  badgeError: { backgroundColor: "#fef2f2" },
  badgeText: { fontSize: 12, fontFamily: "Outfit-SemiBold" },
  textSuccess: { color: "#10b981" },
  textWarning: { color: "#f59e0b" },
  textError: { color: "#ef4444" },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: "#1e293b",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#64748b",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    color: "#1e293b",
  },
  closeBtn: {
    padding: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
  },
  modalBody: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: "Outfit-SemiBold",
    color: "#475569",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
    height: "100%",
    fontFamily: "Outfit-Medium",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 16,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "white",
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: "#64748b",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
  saveBtn: {
    flex: 2,
    borderRadius: 14,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnGradient: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },

  // Stock Modal Specifics
  stockModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  stockModalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
  },
  stockItemInfo: {
    alignItems: "center",
    padding: 24,
  },
  stockItemName: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 4,
  },
  stockItemSku: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 32,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginBottom: 32,
  },
  stockStepBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  adjustmentValueContainer: {
    alignItems: "center",
    width: 100,
  },
  adjustmentText: {
    fontSize: 32,
    fontFamily: "Outfit-Bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  newStockText: {
    fontSize: 13,
    color: "#64748b",
    fontFamily: "Outfit-Medium",
  },

  fabContainer: {
    position: "absolute",
    bottom: 30,
    right: 24,
    borderRadius: 30,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
