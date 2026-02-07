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
  IndianRupee,
  Calendar,
  CreditCard,
  Percent,
} from "lucide-react-native";
import { useOrderStore, OrderItem } from "@/store/orderStore";
import { useCustomerStore } from "@/store/customerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useEmployeeStore } from "@/store/employeeStore";
import { useInventoryStore } from "@/store/inventoryStore";
import { format } from "date-fns";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  primary: "#4f46e5", // Indigo 600
  background: "#f8fafc", // Slate 50
  cardBg: "#ffffff",
  textPrincipal: "#0f172a", // Slate 900
  textSecondary: "#64748b", // Slate 500
  border: "#e2e8f0", // Slate 200
  danger: "#ef4444",
  dangerBg: "#fef2f2",
  success: "#10b981",
  successBg: "#ecfdf5",
};

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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(public)/sales")
          }
          style={styles.backBtn}
        >
          <ArrowLeft size={24} color={COLORS.textPrincipal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Order</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Save size={18} color="white" />
              <Text style={styles.saveBtnText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Section: Basic Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Details</Text>

            {/* Sub Company Picker */}
            <Text style={styles.label}>Bill From</Text>
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

            <View style={{ height: 16 }} />

            {/* Customer Picker */}
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

            <View style={{ height: 16 }} />

            {/* Salesman Picker */}
            <Text style={styles.label}>Salesman</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipContainer}
            >
              {salesmen.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setSelectedSalesmanId(s.id)}
                  style={[
                    styles.chip,
                    selectedSalesmanId === s.id && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedSalesmanId === s.id && styles.chipTextActive,
                    ]}
                  >
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[styles.row, { marginTop: 16 }]}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Order Date</Text>
                <View style={styles.inputWrapper}>
                  <Calendar
                    size={16}
                    color={COLORS.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={orderDate}
                    onChangeText={setOrderDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              </View>
              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Payment Mode</Text>
                <View style={styles.miniPicker}>
                  <Text style={styles.miniPickerLabel}>{paymentMode}</Text>
                  <ChevronDown size={16} color={COLORS.textSecondary} />
                </View>
              </View>
            </View>
          </View>

          {/* Section: Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Order Items</Text>
              <TouchableOpacity
                onPress={handleAddItem}
                style={styles.addItemBtn}
              >
                <Plus size={16} color={COLORS.primary} />
                <Text style={styles.addItemBtnText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNumber}>Item #{index + 1}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(index)}
                    style={styles.deleteItemBtn}
                  >
                    <Trash2 size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Select Product</Text>
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
                          styles.miniChip,
                          item.itemId === p.id && styles.miniChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.miniChipText,
                            item.itemId === p.id && styles.miniChipTextActive,
                          ]}
                        >
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.itemFieldsRow}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Qty</Text>
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="numeric"
                      value={String(item.quantity)}
                      onChangeText={(val) =>
                        handleItemChange(index, "quantity", Number(val))
                      }
                    />
                  </View>
                  <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Free</Text>
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="numeric"
                      value={String(item.freeQty)}
                      onChangeText={(val) =>
                        handleItemChange(index, "freeQty", Number(val))
                      }
                    />
                  </View>
                  <View
                    style={[styles.fieldGroup, { flex: 1.5, marginLeft: 8 }]}
                  >
                    <Text style={styles.label}>Price</Text>
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="numeric"
                      value={String(item.sellingPrice)}
                      onChangeText={(val) =>
                        handleItemChange(index, "sellingPrice", Number(val))
                      }
                    />
                  </View>
                </View>

                <View style={styles.itemTotalRow}>
                  <Text style={styles.itemTotalLabel}>Subtotal:</Text>
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

          {/* Section: Summary & Totals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>

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

            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Discount</Text>
                <View style={styles.inputWrapper}>
                  <Percent
                    size={16}
                    color={COLORS.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={discount}
                    onChangeText={setDiscount}
                  />
                </View>
              </View>
              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Paid Amount</Text>
                <View style={styles.inputWrapper}>
                  <IndianRupee
                    size={16}
                    color={COLORS.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={amountPaid}
                    onChangeText={setAmountPaid}
                  />
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>
                ₹{grandTotal.toLocaleString()}
              </Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Remaining Balance</Text>
              <Text
                style={[
                  styles.balanceValue,
                  grandTotal - Number(amountPaid) <= 0 && styles.successText,
                ]}
              >
                ₹{(grandTotal - Number(amountPaid)).toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.bottomSaveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.bottomSaveBtnText}>Confirm Order</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
    borderRadius: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "white",
    fontFamily: "Outfit-SemiBold",
    fontSize: 13,
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
    borderWidth: 1,
    borderColor: COLORS.border,
    // Shadow
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
  },
  label: {
    fontSize: 12,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: COLORS.textPrincipal,
    fontFamily: "Outfit-Medium",
  },
  smallInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: COLORS.textPrincipal,
    textAlign: "right",
    fontFamily: "Outfit-Bold",
  },
  miniPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  miniPickerLabel: {
    fontSize: 14,
    color: COLORS.textPrincipal,
    fontFamily: "Outfit-Medium",
  },
  chipContainer: {
    gap: 8,
    paddingBottom: 4, // for shadow visibility if needed
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
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
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addItemBtnText: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: "Outfit-Bold",
    textTransform: "uppercase",
  },
  itemCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  itemNumber: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },
  deleteItemBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: COLORS.dangerBg,
  },
  miniChip: {
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  miniChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  miniChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },
  miniChipTextActive: {
    color: "white",
    fontFamily: "Outfit-SemiBold",
  },
  itemFieldsRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  itemTotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  itemTotalLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  itemTotalValue: {
    fontSize: 14,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.textPrincipal,
    fontFamily: "Outfit-SemiBold",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
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
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  balanceLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  balanceValue: {
    fontSize: 14,
    fontFamily: "Outfit-Bold",
    color: COLORS.danger,
  },
  successText: {
    color: COLORS.success,
  },
  bottomSaveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
    // Shadow
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomSaveBtnText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
