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
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  Truck,
  Building,
} from "lucide-react-native";
import { usePurchaseStore, PurchaseItem } from "@/store/purchaseStore";
import { useInventoryStore } from "@/store/inventoryStore";
import { useSettingsStore } from "@/store/settingsStore";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function EditPurchaseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { purchases, updatePurchase } = usePurchaseStore();
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

      // Initialize form with existing purchase data
      if (id) {
        const purchase = purchases.find((p) => p.id === id);
        if (purchase) {
          setSupplierName(purchase.supplier_name);
          if (purchase.company_name) {
            const company = subCompanies.find(
              (c) => c.name === purchase.company_name,
            );
            if (company) setSelectedSubCompanyId(company.id);
          }
          setPurchaseDate(purchase.date);
          if (purchase.paymentMode) setPaymentMode(purchase.paymentMode);
          if (purchase.items && purchase.items.length > 0) {
            setItems(purchase.items);
          }
        } else {
          Alert.alert("Error", "Purchase not found");
          router.back();
        }
      }

      if (subCompanies && subCompanies.length > 0 && !selectedSubCompanyId) {
        setSelectedSubCompanyId(subCompanies[0].id);
      }

      setIsLoading(false);
    };
    loadData();
  }, [id]);

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

  const handleUpdate = async () => {
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

      await updatePurchase(id as string, purchaseData);

      // Note: Stock updates on edit are complex (revert old, add new).
      // For now, assuming manual stock adjustment or simple overwrite if acceptable.
      // Ideally, the backend handles this delta. For this task, we will just update the purchase record.

      // Update cost price for items
      for (const item of validItems) {
        const product = inventory.find((p) => p.id === item.itemId);
        // Only update cost price for now
        if (product) {
          await updateInventoryItem(product.id, {
            unit_price: item.unitPrice,
          });
        }
      }

      Alert.alert("Success", "Purchase updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update purchase");
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.textPrincipal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Purchase</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Truck size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Supplier Details</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Supplier Name</Text>
              <TextInput
                style={styles.input}
                value={supplierName}
                onChangeText={setSupplierName}
                placeholder="Enter supplier name"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Bill To (Company)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScroll}
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
                    <Building
                      size={14}
                      color={
                        selectedSubCompanyId === sc.id
                          ? "white"
                          : COLORS.textSecondary
                      }
                    />
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
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={purchaseDate}
                  onChangeText={setPurchaseDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Payment Mode</Text>
                <View style={styles.selectInput}>
                  <Text style={styles.selectInputText}>{paymentMode}</Text>
                  <ChevronDown size={16} color={COLORS.textSecondary} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Plus size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Items</Text>
              </View>
              <TouchableOpacity onPress={handleAddItem} style={styles.addBtn}>
                <Text style={styles.addBtnText}>+ Add Item</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemIndex}>#{index + 1}</Text>
                  <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                    <Trash2 size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Product</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipScroll}
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
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Quantity</Text>
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="numeric"
                      value={String(item.quantity)}
                      onChangeText={(val) =>
                        handleItemChange(index, "quantity", Number(val))
                      }
                    />
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <Text style={styles.label}>Cost Price</Text>
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="numeric"
                      value={String(item.unitPrice)}
                      onChangeText={(val) =>
                        handleItemChange(index, "unitPrice", Number(val))
                      }
                    />
                  </View>
                  <View
                    style={{
                      flex: 1.5,
                      alignItems: "flex-end",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={styles.itemSubtotalLabel}>Subtotal</Text>
                    <Text style={styles.itemSubtotalValue}>
                      ₹
                      {(item.quantity * (item.unitPrice || 0)).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerLabel}>
            Total Amount ({items.length} items)
          </Text>
          <Text style={styles.footerValue}>₹{subtotal.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          onPress={handleUpdate}
          disabled={isSaving}
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
        >
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Save size={20} color="white" />
              <Text style={styles.saveBtnText}>Update Purchase</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    fontFamily: "Outfit-Medium",
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
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.textPrincipal,
    fontFamily: "Outfit-Medium",
  },
  selectInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
  },
  selectInputText: {
    fontSize: 14,
    color: COLORS.textPrincipal,
    fontFamily: "Outfit-Medium",
  },
  chipScroll: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },
  chipTextActive: {
    color: "white",
    fontFamily: "Outfit-SemiBold",
  },
  addBtn: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 13,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.primary,
  },
  itemCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  itemIndex: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
    color: COLORS.textSecondary,
  },
  productChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  productChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },
  productChipTextActive: {
    color: "white",
    fontFamily: "Outfit-SemiBold",
  },
  smallInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
    color: COLORS.textPrincipal,
    textAlign: "center",
    fontFamily: "Outfit-Medium",
  },
  itemSubtotalLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },
  itemSubtotalValue: {
    fontSize: 14,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  footer: {
    backgroundColor: "white",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
  },
  footerSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  footerLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },
  footerValue: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
});
