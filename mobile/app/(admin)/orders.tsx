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
  ScrollView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  Printer,
  Trash2,
  ChevronRight,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  X,
  Plus,
  ShoppingBag,
  CreditCard,
  Truck,
  FileText,
  Eye,
  FilePlus,
} from "lucide-react-native";
import { useOrderStore, Order } from "@/store/orderStore";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { ErrorBanner } from "@/components/ErrorBanner";

const StatusBadge = ({
  status,
  type,
}: {
  status: string;
  type: "delivery" | "payment";
}) => {
  if (type === "delivery") {
    if (status === "Completed") {
      return (
        <View style={[styles.badge, styles.badgeSuccess]}>
          <CheckCircle2 size={12} color="#10b981" />
          <Text style={[styles.badgeText, styles.textSuccess]}>Delivered</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgeWarning]}>
        <Clock size={12} color="#f59e0b" />
        <Text style={[styles.badgeText, styles.textWarning]}>
          {status || "Pending"}
        </Text>
      </View>
    );
  } else {
    if (status === "Paid") {
      return (
        <View style={[styles.badge, styles.badgeSuccess]}>
          <CheckCircle2 size={12} color="#10b981" />
          <Text style={[styles.badgeText, styles.textSuccess]}>Paid</Text>
        </View>
      );
    }
    if (status === "Partial") {
      return (
        <View style={[styles.badge, styles.badgeInfo]}>
          <AlertCircle size={12} color="#3b82f6" />
          <Text style={[styles.badgeText, styles.textInfo]}>Partial</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgeError]}>
        <AlertCircle size={12} color="#ef4444" />
        <Text style={[styles.badgeText, styles.textError]}>Unpaid</Text>
      </View>
    );
  }
};

const OrderCard = ({
  order,
  onPress,
  onPay,
  onDelete,
}: {
  order: Order;
  onPress: (order: Order) => void;
  onPay: (order: Order) => void;
  onDelete: (id: string) => void;
}) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => onPress(order)}
    activeOpacity={0.7}
  >
    <View style={styles.cardHeader}>
      <View style={styles.orderIdContainer}>
        <ShoppingBag size={14} color="#64748b" />
        <Text style={styles.orderId}>
          #{order.id.substring(0, 8).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.orderDate}>
        {format(new Date(order.created_at || ""), "MMM dd, hh:mm a")}
      </Text>
    </View>

    <View style={styles.customerRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {order.customer_name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.customerName}>{order.customer_name}</Text>
    </View>

    <View style={styles.divider} />

    <View style={styles.cardFooter}>
      <View style={styles.statsColumn}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>
            ₹{order.total.toLocaleString()}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Balance</Text>
          <Text
            style={[
              styles.balanceValue,
              order.total - (order.amountPaid || 0) <= 0
                ? styles.textSuccess
                : styles.textError,
            ]}
          >
            ₹{(order.total - (order.amountPaid || 0)).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.statusColumn}>
        <StatusBadge status={order.status} type="delivery" />
        <StatusBadge status={order.paymentStatus || "Unpaid"} type="payment" />
      </View>
    </View>

    <View style={styles.actionRow}>
      {order.paymentStatus !== "Paid" && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onPay(order)}
        >
          <CreditCard size={16} color="#2563eb" />
          <Text style={styles.actionButtonText}>Pay Now</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={() => onDelete(order.id)}
      >
        <Trash2 size={16} color="#ef4444" />
      </TouchableOpacity>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.detailsButton}>
        <FileText size={16} color="#64748b" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => onPress(order)}
      >
        <Eye size={16} color="#64748b" />
        <Text style={styles.detailsButtonText}>Details</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

export default function OrdersScreen() {
  const router = useRouter();
  const {
    orders,
    isLoading,
    error,
    fetchOrders,
    fetchMoreOrders,
    hasMore,
    subscribeToOrders,
    unsubscribeFromOrders,
    updateOrder,
    deleteOrder,
  } = useOrderStore();

  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<
    "Cash" | "UPI" | "Card" | "Net Banking"
  >("Cash");
  const [deliveryStatus, setDeliveryStatus] = useState("Pending");

  useEffect(() => {
    fetchOrders();
    subscribeToOrders();
    return () => unsubscribeFromOrders();
  }, [fetchOrders, subscribeToOrders, unsubscribeFromOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        order.id.toLowerCase().includes(search.toLowerCase()),
    );
  }, [orders, search]);

  const handleOpenPayment = (order: Order) => {
    setSelectedOrder(order);
    const balance = order.total - (order.amountPaid || 0);
    setPaymentAmount(String(balance));
    setPaymentMode(order.paymentMode || "Cash");
    setDeliveryStatus(order.status);
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async () => {
    if (!selectedOrder || !paymentAmount) return;

    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      const newAmountPaid = (selectedOrder.amountPaid || 0) + amount;
      const updates: any = {
        amountPaid: newAmountPaid,
        paymentMode: paymentMode,
        paymentStatus:
          newAmountPaid >= selectedOrder.total ? "Paid" : "Partial",
        status: deliveryStatus,
      };

      await updateOrder(selectedOrder.id, updates);
      setIsPaymentModalOpen(false);
      Alert.alert("Success", "Payment recorded successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to record payment");
    }
  };

  const handleDeleteOrder = (id: string) => {
    Alert.alert(
      "Delete Order",
      "This will revert stock and customer balance. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteOrder(id);
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete order");
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
        <Text style={styles.headerTitle}>Orders</Text>
        <Text style={styles.headerSubtitle}>Manage customer orders</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customer or ID..."
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

      <ErrorBanner message={error} onRetry={fetchOrders} />

      <FlashList<Order>
        data={filteredOrders}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={(o) => console.log("Press order", o.id)} // View details placeholder
            onPay={handleOpenPayment}
            onDelete={handleDeleteOrder}
          />
        )}
        keyExtractor={(item) => item.id}
        // @ts-ignore
        estimatedItemSize={200}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={() => fetchMoreOrders()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          isLoading && !refreshing && orders.length > 0 ? (
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
                  <ShoppingBag size={48} color="#94a3b8" />
                </View>
                <Text style={styles.emptyText}>No orders found</Text>
              </View>
            )}
          </View>
        )}
      />

      {/* Payment Modal */}
      <Modal visible={isPaymentModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <TouchableOpacity
                onPress={() => setIsPaymentModalOpen(false)}
                style={styles.closeBtn}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.orderSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Customer</Text>
                    <Text style={styles.summaryValue}>
                      {selectedOrder.customer_name}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Amount</Text>
                    <Text style={styles.summaryValue}>
                      ₹{selectedOrder.total.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Balance Due</Text>
                    <Text style={[styles.summaryValue, { color: "#ef4444" }]}>
                      ₹
                      {(
                        selectedOrder.total - (selectedOrder.amountPaid || 0)
                      ).toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Amount to Pay</Text>
                  <View style={styles.inputContainer}>
                    <IndianRupee
                      size={16}
                      color="#64748b"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={paymentAmount}
                      onChangeText={setPaymentAmount}
                      keyboardType="numeric"
                      placeholder="Enter amount"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Payment Mode</Text>
                  <View style={styles.modeContainer}>
                    {["Cash", "UPI", "Card", "Net Banking"].map((mode) => (
                      <TouchableOpacity
                        key={mode}
                        style={[
                          styles.modeBtn,
                          paymentMode === mode && styles.modeBtnActive,
                        ]}
                        onPress={() => setPaymentMode(mode as any)}
                      >
                        <Text
                          style={[
                            styles.modeBtnText,
                            paymentMode === mode && styles.modeBtnTextActive,
                          ]}
                        >
                          {mode}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Delivery Status</Text>
                  <View style={styles.modeContainer}>
                    {["Pending", "Completed"].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.modeBtn,
                          deliveryStatus === status && styles.modeBtnActive,
                        ]}
                        onPress={() => setDeliveryStatus(status)}
                      >
                        <Text
                          style={[
                            styles.modeBtnText,
                            deliveryStatus === status &&
                              styles.modeBtnTextActive,
                          ]}
                        >
                          {status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsPaymentModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSavePayment}
              >
                <LinearGradient
                  colors={["#2563eb", "#1d4ed8"]}
                  style={styles.saveBtnGradient}
                >
                  <Text style={styles.saveBtnText}>Record Payment</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <TouchableOpacity
        style={styles.fabContainer}
        onPress={() => router.push("/(admin)/new-order")}
        activeOpacity={0.8}
      >
        <LinearGradient colors={["#2563eb", "#1d4ed8"]} style={styles.fab}>
          <FilePlus size={28} color="white" />
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
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderId: {
    fontSize: 12,
    fontFamily: "Outfit-SemiBold",
    color: "#475569",
  },
  orderDate: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "Outfit-Medium",
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: "#4338ca",
  },
  customerName: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: "#1e293b",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statsColumn: {
    justifyContent: "space-between",
    gap: 8,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amountLabel: {
    fontSize: 12,
    color: "#64748b",
    width: 50,
    fontFamily: "Outfit-Medium",
  },
  amountValue: {
    fontSize: 14,
    fontFamily: "Outfit-SemiBold",
    color: "#1e293b",
  },
  balanceValue: {
    fontSize: 14,
    fontFamily: "Outfit-Bold",
  },
  statusColumn: {
    alignItems: "flex-end",
    gap: 8,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: "#fef2f2",
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: "Outfit-SemiBold",
    color: "#2563eb",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailsButtonText: {
    fontSize: 13,
    color: "#64748b",
    fontFamily: "Outfit-Medium",
  },

  // Badge Styles
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Outfit-SemiBold",
  },
  badgeSuccess: { backgroundColor: "#ecfdf5" },
  textSuccess: { color: "#10b981" },
  badgeWarning: { backgroundColor: "#fffbeb" },
  textWarning: { color: "#f59e0b" },
  badgeError: { backgroundColor: "#fef2f2" },
  textError: { color: "#ef4444" },
  badgeInfo: { backgroundColor: "#eff6ff" },
  textInfo: { color: "#3b82f6" },

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
  orderSummary: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "Outfit-Regular",
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: "#1e293b",
  },
  inputGroup: {
    marginBottom: 20,
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
  modeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modeBtnActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  modeBtnText: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "Outfit-Medium",
  },
  modeBtnTextActive: {
    color: "#2563eb",
    fontFamily: "Outfit-SemiBold",
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
