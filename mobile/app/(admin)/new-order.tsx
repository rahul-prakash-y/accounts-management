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
  User,
  ShoppingBag,
  IndianRupee,
  Search,
  Calendar,
  CreditCard,
  Banknote,
  Wallet,
  Grid,
  Box,
} from "lucide-react-native";
import { useOrderStore, OrderItem } from "@/store/orderStore";
import { useCustomerStore } from "@/store/customerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useEmployeeStore } from "@/store/employeeStore";
import { useInventoryStore } from "@/store/inventoryStore";
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
  success: "#10b981",
  successBg: "#ecfdf5",
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

export default function NewOrderScreen() {
  const router = useRouter();
  const { addOrder } = useOrderStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { subCompanies, fetchSettings } = useSettingsStore();
  const { employees, fetchEmployees } = useEmployeeStore();
  const { inventory, fetchInventory } = useInventoryStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedSubCompanyId, setSelectedSubCompanyId] = useState("");
  const [selectedSalesmanId, setSelectedSalesmanId] = useState("");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentMode, setPaymentMode] = useState<
    "Cash" | "UPI" | "Card" | "Net Banking"
  >("Cash");
  const [discount, setDiscount] = useState("0");
  const [amountPaid, setAmountPaid] = useState("0");
  const [items, setItems] = useState<OrderItem[]>([
    {
      itemId: "",
      quantity: 1,
      freeQty: 0,
      unitPrice: 0,
      sellingPrice: 0,
      description: "",
    },
  ]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchCustomers(),
        fetchSettings(),
        fetchEmployees(),
        fetchInventory(),
      ]);

      // Select first sub-company by default if available
      if (subCompanies && subCompanies.length > 0 && !selectedSubCompanyId) {
        setSelectedSubCompanyId(subCompanies[0].id);
      }

      setIsLoading(false);
    };
    loadData();
  }, []);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId],
  );

  const salesmen = useMemo(
    () => employees.filter((e) => e.department === "Sales"),
    [employees],
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.quantity * (item.sellingPrice || 0),
        0,
      ),
    [items],
  );

  const totalQuantity = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.quantity + (item.freeQty || 0), 0),
    [items],
  );

  const grandTotal = useMemo(
    () => subtotal - Number(discount || 0),
    [subtotal, discount],
  );

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        itemId: "",
        quantity: 1,
        freeQty: 0,
        unitPrice: 0,
        sellingPrice: 0,
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
          freeQty: 0,
          unitPrice: 0,
          sellingPrice: 0,
          description: "",
        },
      ]);
    } else {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof OrderItem,
    value: any,
  ) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === "itemId") {
      const product = inventory.find((p) => p.id === value);
      if (product) {
        item.itemId = value;
        item.unitPrice = product.unit_price;
        item.sellingPrice = product.price;
        item.description = product.name;
      }
    } else {
      (item as any)[field] = value;
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!selectedSubCompanyId)
      return Alert.alert("Error", "Please select a Bill From Company");
    if (!selectedCustomerId)
      return Alert.alert("Error", "Please select a Customer");
    if (!selectedSalesmanId)
      return Alert.alert("Error", "Please select a Salesman");

    const validItems = items.filter((i) => i.itemId && i.quantity > 0);
    if (validItems.length === 0)
      return Alert.alert("Error", "Please add at least one valid item");

    setIsSaving(true);
    try {
      const orderData = {
        id: "", // Store generates ID
        customer_id: selectedCustomerId,
        customer_name: selectedCustomer?.name || "",
        customer_address: selectedCustomer?.address || "",
        salesman_id: selectedSalesmanId,
        subCompanyId: selectedSubCompanyId,
        date: orderDate,
        items: validItems,
        total: grandTotal,
        discount: Number(discount),
        amountPaid: Number(amountPaid),
        paymentMode: paymentMode,
        paymentStatus:
          Number(amountPaid) >= grandTotal
            ? "Paid"
            : ((Number(amountPaid) > 0 ? "Partial" : "Unpaid") as any),
        status: "Pending",
      };

      await addOrder(orderData);
      Alert.alert("Success", "Order created successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create order");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading form data...</Text>
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
              : router.replace("/(admin)/orders")
          }
          style={styles.backBtn}
        >
          <ArrowLeft size={24} color={COLORS.textPrincipal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Order</Text>
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
          {/* Section: Basic Details */}
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Basic Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bill From (Sub-Company)</Text>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipContainer}
              >
                {customers.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setSelectedCustomerId(c.id)}
                    style={[
                      styles.chip,
                      selectedCustomerId === c.id && styles.chipActive,
                    ]}
                  >
                    <User
                      size={14}
                      color={
                        selectedCustomerId === c.id
                          ? "white"
                          : COLORS.textSecondary
                      }
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        selectedCustomerId === c.id && styles.chipTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {selectedCustomer && (
                <Text style={styles.addressSubtext}>
                  📍 {selectedCustomer.address || "No address found"}
                </Text>
              )}
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Salesman</Text>
                <View style={styles.miniPicker}>
                  {/* Simplified Salesman Picker for UI */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {salesmen.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        onPress={() => setSelectedSalesmanId(s.id)}
                        style={[
                          styles.pill,
                          selectedSalesmanId === s.id && styles.pillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            selectedSalesmanId === s.id &&
                              styles.pillTextActive,
                          ]}
                        >
                          {s.name.split(" ")[0]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Order Date</Text>
                <View style={styles.inputWrapper}>
                  <Calendar
                    size={16}
                    color={COLORS.textSecondary}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={styles.inputPlain}
                    value={orderDate}
                    onChangeText={setOrderDate}
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

          {/* Section: Items */}
          <View style={styles.itemsHeader}>
            <Text style={styles.sectionTitle}>Order Items</Text>
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
                          {p.name} (₹{p.price})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.itemFieldsRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Qty</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(item.quantity)}
                      onChangeText={(val) =>
                        handleItemChange(index, "quantity", Number(val))
                      }
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Free Qty</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(item.freeQty)}
                      onChangeText={(val) =>
                        handleItemChange(index, "freeQty", Number(val))
                      }
                    />
                  </View>
                  <View
                    style={[styles.inputGroup, { flex: 1.5, marginLeft: 8 }]}
                  >
                    <Text style={styles.label}>Selling Price</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(item.sellingPrice)}
                      onChangeText={(val) =>
                        handleItemChange(index, "sellingPrice", Number(val))
                      }
                    />
                  </View>
                </View>

                <View style={styles.itemFooter}>
                  <Text style={styles.itemTotalLabel}>Subtotal</Text>
                  <Text style={styles.itemTotalValue}>
                    ₹
                    {(
                      item.quantity * (item.sellingPrice || 0)
                    ).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Section: Summary */}
          <View style={[styles.summarySection, SHADOWS.small]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Quantity</Text>
              <Text style={styles.summaryValue}>{totalQuantity}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                ₹{subtotal.toLocaleString()}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryActionRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Discount</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={discount}
                  onChangeText={setDiscount}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Paid Amount</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={amountPaid}
                  onChangeText={setAmountPaid}
                />
              </View>
            </View>

            <View style={[styles.summaryRow, { marginTop: 16 }]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>
                ₹{grandTotal.toLocaleString()}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.balanceLabel}>Balance Due</Text>
              <Text
                style={[
                  styles.balanceValue,
                  grandTotal - Number(amountPaid) <= 0 && {
                    color: COLORS.success,
                  },
                ]}
              >
                ₹{(grandTotal - Number(amountPaid)).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, SHADOWS.medium]}>
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveBtnText}>Create Order</Text>
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
    gap: 16,
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

  fieldRow: {
    flexDirection: "row",
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
  pill: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: "#eff6ff",
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },
  pillTextActive: {
    color: COLORS.primary,
    fontFamily: "Outfit-SemiBold",
  },
  miniPicker: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 10,
    height: 52,
    justifyContent: "center",
  },
  addressSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: "Outfit-Regular",
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
    fontFamily: "Outfit-Medium",
  },
  productChipTextActive: {
    color: COLORS.primary,
    fontFamily: "Outfit-Bold",
  },
  itemFieldsRow: {
    flexDirection: "row",
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    backgroundColor: COLORS.background,
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

  // Summary Section
  summarySection: {
    marginTop: 24,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  summaryActionRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  grandTotalValue: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    color: COLORS.primary,
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textSecondary,
  },
  balanceValue: {
    fontSize: 15,
    fontFamily: "Outfit-Bold",
    color: COLORS.danger,
  },

  // Footer Link
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
