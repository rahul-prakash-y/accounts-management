import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  Box,
  Calendar,
  CreditCard,
  Banknote,
  Wallet,
  Grid,
} from "lucide-react-native";
import { usePurchaseStore, PurchaseItem } from "@/store/purchaseStore";
import { useInventoryStore } from "@/store/inventoryStore";
import { useSettingsStore } from "@/store/settingsStore";
import { format } from "date-fns";
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
  inputBg: "#ffffff",
  danger: "#ef4444",
  dangerBg: "#fef2f2",
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

const PAYMENT_MODES: ("Cash" | "UPI" | "Card" | "Net Banking")[] = [
  "Cash",
  "UPI",
  "Card",
  "Net Banking",
];

export default function NewPurchaseScreen() {
  const router = useRouter();
  const { addPurchase } = usePurchaseStore();
  const { inventory, fetchInventory, updateInventoryItem } =
    useInventoryStore();
  const { subCompanies, fetchSettings } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [supplierName, setSupplierName] = useState("");
  const [selectedSubCompanyId, setSelectedSubCompanyId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentMode, setPaymentMode] = useState<
    "Cash" | "UPI" | "Card" | "Net Banking"
  >("Cash");
  const [items, setItems] = useState<PurchaseItem[]>([
    {
      itemId: "",
      quantity: 1,
      unitPrice: 0,
      description: "",
    },
  ]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchInventory(), fetchSettings()]);

      if (subCompanies && subCompanies.length > 0 && !selectedSubCompanyId) {
        setSelectedSubCompanyId(subCompanies[0].id);
      }

      setIsLoading(false);
    };
    loadData();
  }, []);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.quantity * (item.unitPrice || 0),
        0,
      ),
    [items],
  );

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        itemId: "",
        quantity: 1,
        unitPrice: 0,
        description: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      setItems([
        {
          itemId: "",
          quantity: 1,
          unitPrice: 0,
          description: "",
        },
      ]);
    } else {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof PurchaseItem,
    value: any,
  ) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === "itemId") {
      const product = inventory.find((p) => p.id === value);
      if (product) {
        item.itemId = value;
        item.unitPrice = product.unit_price; // Current cost price as default
        item.description = product.name;
      }
    } else {
      (item as any)[field] = value;
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!supplierName)
      return Alert.alert("Error", "Please enter supplier name");
    if (!selectedSubCompanyId)
      return Alert.alert("Error", "Please select a company");

    const validItems = items.filter((i) => i.itemId && i.quantity > 0);
    if (validItems.length === 0)
      return Alert.alert("Error", "Please add at least one valid item");

    setIsSaving(true);
    try {
      const selectedSubCompany = subCompanies.find(
        (sc) => sc.id === selectedSubCompanyId,
      );

      const purchaseData = {
        supplier_name: supplierName,
        company_name: selectedSubCompany?.name || "",
        date: purchaseDate,
        items: validItems,
        total: subtotal,
        status: "Received",
        items_count: validItems.length,
        totalAmount: subtotal,
        supplierName: supplierName,
        paymentStatus: "Paid",
        paymentMode: paymentMode,
      };

      // 1. Save Purchase Record
      await addPurchase(purchaseData);

      // 2. Update Inventory Stock (Logic mimicked from desktop)
      for (const item of validItems) {
        const product = inventory.find((p) => p.id === item.itemId);
        if (product) {
          await updateInventoryItem(product.id, {
            stock_level: (product.stock_level || 0) + item.quantity,
            unit_price: item.unitPrice, // Update to latest cost price
          });
        }
      }

      Alert.alert("Success", "Purchase recorded successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to record purchase");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(admin)/purchases")
          }
          style={styles.backBtn}
        >
          <ArrowLeft size={24} color={COLORS.textPrincipal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Purchase</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Supplier Section */}
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Supplier Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Supplier Name</Text>
              <TextInput
                style={styles.input}
                value={supplierName}
                onChangeText={setSupplierName}
                placeholder="Who is this purchase from?"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bill To (Company)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipContainer}
              >
                {subCompanies.map((sc) => (
                  <TouchableOpacity
                    key={sc.id}
                    onPress={() => setSelectedSubCompanyId(sc.id)}
                    style={[
                      styles.chip,
                      selectedSubCompanyId === sc.id && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedSubCompanyId === sc.id && styles.chipTextActive,
                      ]}
                    >
                      {sc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Date</Text>
                <View style={styles.inputWrapper}>
                  <Calendar
                    size={16}
                    color={COLORS.textSecondary}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={styles.inputPlain}
                    value={purchaseDate}
                    onChangeText={setPurchaseDate}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Mode</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipContainer}
              >
                {PAYMENT_MODES.map((mode) => {
                  const Icon =
                    mode === "Cash"
                      ? Banknote
                      : mode === "Card"
                        ? CreditCard
                        : mode === "UPI"
                          ? Wallet
                          : Grid;
                  return (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setPaymentMode(mode)}
                      style={[
                        styles.chip,
                        paymentMode === mode && styles.chipActive,
                      ]}
                    >
                      <Icon
                        size={14}
                        color={
                          paymentMode === mode ? "white" : COLORS.textSecondary
                        }
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          paymentMode === mode && styles.chipTextActive,
                        ]}
                      >
                        {mode}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Items Section */}
          <View style={styles.itemsHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity onPress={handleAddItem} style={styles.addItemBtn}>
              <Plus size={16} color={COLORS.primary} />
              <Text style={styles.addItemBtnText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 16 }}>
            {items.map((item, index) => (
              <View key={index} style={[styles.itemCard, SHADOWS.small]}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>Item #{index + 1}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(index)}
                    style={styles.removeBtn}
                  >
                    <Trash2 size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>

                {/* Product Select */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Product</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipContainer}
                  >
                    {inventory.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => handleItemChange(index, "itemId", p.id)}
                        style={[
                          styles.productChip,
                          item.itemId === p.id && styles.productChipActive,
                        ]}
                      >
                        <Box
                          size={14}
                          color={
                            item.itemId === p.id
                              ? COLORS.primary
                              : COLORS.textSecondary
                          }
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.productChipText,
                            item.itemId === p.id &&
                              styles.productChipTextActive,
                          ]}
                        >
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Quantity</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(item.quantity)}
                      onChangeText={(val) =>
                        handleItemChange(index, "quantity", Number(val))
                      }
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1.5 }]}>
                    <Text style={styles.label}>Cost Price (Unit)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(item.unitPrice)}
                      onChangeText={(val) =>
                        handleItemChange(index, "unitPrice", Number(val))
                      }
                    />
                  </View>
                </View>

                <View style={styles.itemFooter}>
                  <Text style={styles.itemTotalLabel}>Subtotal</Text>
                  <Text style={styles.itemTotalValue}>
                    ₹{(item.quantity * (item.unitPrice || 0)).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, SHADOWS.medium]}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>
                Total ({items.length} items)
              </Text>
            </View>
            <Text style={styles.totalAmount}>₹{subtotal.toLocaleString()}</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveBtnText}>Record Purchase</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addItemBtnText: {
    fontSize: 13,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.primary,
  },

  // Inputs
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrincipal,
    fontFamily: "Outfit-Medium",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputPlain: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrincipal,
    fontFamily: "Outfit-Medium",
  },

  chipContainer: {
    paddingVertical: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.textPrincipal,
    borderColor: COLORS.textPrincipal,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-SemiBold",
  },
  chipTextActive: {
    color: "white",
    fontFamily: "Outfit-SemiBold",
  },

  row: {
    flexDirection: "row",
    gap: 16,
  },

  // Item Card
  itemCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralBg,
    paddingBottom: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: "Outfit-Bold",
    color: COLORS.textSecondary,
  },
  removeBtn: {
    padding: 6,
    backgroundColor: COLORS.dangerBg,
    borderRadius: 8,
  },
  productChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productChipActive: {
    backgroundColor: "#eff6ff",
    borderColor: COLORS.primaryLight,
  },
  productChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  productChipTextActive: {
    color: COLORS.primary,
    fontFamily: "Outfit-Bold",
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    backgroundColor: COLORS.neutralBg,
    padding: 12,
    borderRadius: 10,
  },
  itemTotalLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-SemiBold",
  },
  itemTotalValue: {
    fontSize: 15,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },

  // Footer Summary
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-SemiBold",
  },
  totalAmount: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
});
