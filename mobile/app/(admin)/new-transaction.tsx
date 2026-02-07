import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useTransactionStore } from "@/store/transactionStore";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Save,
  Calendar,
  IndianRupee,
  AlignLeft,
  Grid,
  CreditCard,
  Banknote,
  Wallet,
} from "lucide-react-native";
import { format } from "date-fns";

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
  inputBg: "#f8fafc",
  danger: "#ef4444",
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
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};

const CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries",
  "Marketing",
  "Office Supplies",
  "Maintenance",
  "Travel",
  "Other",
];

const PAYMENT_MODES: ("Cash" | "UPI" | "Card" | "Net Banking")[] = [
  "Cash",
  "UPI",
  "Card",
  "Net Banking",
];

export default function NewTransactionScreen() {
  const router = useRouter();
  const { addTransaction } = useTransactionStore();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    amount: "",
    category: "Other",
    paymentMode: "Cash" as "Cash" | "UPI" | "Card" | "Net Banking",
  });

  const handleSave = async () => {
    if (!formData.description)
      return Alert.alert("Error", "Please enter description");
    if (!formData.amount || isNaN(Number(formData.amount)))
      return Alert.alert("Error", "Please enter valid amount");
    if (!formData.category)
      return Alert.alert("Error", "Please select category");

    setIsLoading(true);
    try {
      await addTransaction({
        type: "expense",
        date: formData.date,
        description: formData.description,
        amount: Number(formData.amount),
        category: formData.category,
        paymentMode: formData.paymentMode,
      });

      Alert.alert("Success", "Expense recorded successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to record expense");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(admin)/transactions")
          }
          style={styles.backBtn}
        >
          <ArrowLeft size={24} color={COLORS.textPrincipal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Expense</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Amount Input Section (Hero) */}
          <View style={[styles.amountCard, SHADOWS.medium]}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <View style={styles.amountInputWrapper}>
              <IndianRupee
                size={28}
                color={COLORS.textPrincipal}
                style={{ marginTop: 4 }}
              />
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                value={formData.amount}
                onChangeText={(text) =>
                  setFormData({ ...formData, amount: text })
                }
                autoFocus
              />
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <View style={styles.inputWrapper}>
                <AlignLeft
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="What is this expense for?"
                  placeholderTextColor={COLORS.textSecondary}
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData({ ...formData, description: text })
                  }
                />
              </View>
            </View>

            {/* Date & Payment Mode Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Date</Text>
                <View style={styles.inputWrapper}>
                  <Calendar
                    size={18}
                    color={COLORS.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: COLORS.textPrincipal }]}
                    value={format(new Date(formData.date), "dd MMM, yyyy")}
                    editable={false}
                  />
                </View>
              </View>
            </View>

            {/* Payment Mode Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Mode</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modeContainer}
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
                      style={[
                        styles.modeChip,
                        formData.paymentMode === mode && styles.modeChipActive,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, paymentMode: mode })
                      }
                    >
                      <Icon
                        size={16}
                        color={
                          formData.paymentMode === mode
                            ? "white"
                            : COLORS.textSecondary
                        }
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.modeText,
                          formData.paymentMode === mode &&
                            styles.modeTextActive,
                        ]}
                      >
                        {mode}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Category Grid */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryBtn,
                      formData.category === cat && styles.categoryBtnActive,
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat })}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        formData.category === cat && styles.categoryTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, SHADOWS.medium]}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Save size={18} color="white" />
                <Text style={styles.saveBtnText}>Save Transaction</Text>
              </>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "white",
    ...SHADOWS.small,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },

  // Hero Amount Section
  amountCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontFamily: "Outfit-SemiBold",
  },
  amountInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  amountInput: {
    fontSize: 40,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    minWidth: 100,
    textAlign: "center",
  },

  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrincipal,
    fontFamily: "Outfit-Medium",
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },

  // Mode Selection
  modeContainer: {
    paddingRight: 20,
  },
  modeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "white",
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeChipActive: {
    backgroundColor: COLORS.textPrincipal,
    borderColor: COLORS.textPrincipal,
  },
  modeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-SemiBold",
  },
  modeTextActive: {
    color: "white",
    fontFamily: "Outfit-Bold",
  },

  // Category Grid
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: "30%",
    alignItems: "center",
  },
  categoryBtnActive: {
    backgroundColor: "#eff6ff",
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },
  categoryTextActive: {
    color: COLORS.primary,
    fontFamily: "Outfit-Bold",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    flexDirection: "row",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: COLORS.textSecondary,
  },
  saveBtn: {
    flex: 2,
    flexDirection: "row",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: "white",
  },
});
