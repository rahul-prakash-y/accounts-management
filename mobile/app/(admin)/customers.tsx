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
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import {
  UserPlus,
  Search,
  Phone,
  MessageCircle,
  MapPin,
  Trash2,
  Edit2,
  IndianRupee,
  X,
  User,
  ChevronRight,
  UserRound,
} from "lucide-react-native";
import { useCustomerStore, Customer } from "@/store/customerStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorBanner } from "@/components/ErrorBanner";

const CustomerItem = ({
  customer,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  onEdit: (c: Customer) => void;
  onDelete: (id: string) => void;
}) => {
  const handleCall = () => {
    if (customer.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    } else {
      Alert.alert("Error", "No phone number available");
    }
  };

  const handleWhatsApp = () => {
    if (customer.phone) {
      // Remove any non-numeric characters for WhatsApp link
      const cleanPhone = customer.phone.replace(/\D/g, "");
      const url = `whatsapp://send?phone=${cleanPhone}`;

      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to web if app not installed (optional, or just alert)
          Linking.openURL(`https://wa.me/${cleanPhone}`);
        }
      });
    } else {
      Alert.alert("Error", "No phone number available");
    }
  };

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#3b82f6", "#2563eb"]}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>
                {customer.name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{customer.name}</Text>
            <View style={styles.balanceTag}>
              <IndianRupee
                size={12}
                color={customer.balance > 0 ? "#ef4444" : "#10b981"}
              />
              <Text
                style={[
                  styles.balanceText,
                  { color: customer.balance > 0 ? "#ef4444" : "#10b981" },
                ]}
              >
                {customer.balance.toLocaleString()} Due
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => onEdit(customer)}
            >
              <Edit2 size={18} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(customer.id)}
            >
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardBody}>
          {customer.phone && (
            <View style={styles.infoRow}>
              <Phone size={14} color="#64748b" />
              <Text style={styles.infoValue}>{customer.phone}</Text>
            </View>
          )}
          {customer.address && (
            <View style={styles.infoRow}>
              <MapPin size={14} color="#64748b" />
              <Text style={styles.infoValue} numberOfLines={1}>
                {customer.address}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={handleCall}
            disabled={!customer.phone}
          >
            <Phone size={16} color="#0f172a" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.whatsappButton]}
            onPress={handleWhatsApp}
            disabled={!customer.phone}
          >
            <FontAwesome name="whatsapp" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, { color: "#fff" }]}>
              WhatsApp
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function CustomersScreen() {
  const {
    customers,
    isLoading,
    error,
    fetchCustomers,
    fetchMoreCustomers,
    hasMore,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomerStore();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<Omit<Customer, "id" | "balance" | "status">>(
    {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  );

  useEffect(() => {
    fetchCustomers(20, 0);
  }, [fetchCustomers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [customers, search]);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setForm({
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
      });
    } else {
      setEditingCustomer(null);
      setForm({
        name: "",
        email: "",
        phone: "",
        address: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      Alert.alert("Error", "Name is required");
      return;
    }

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, form);
      } else {
        await addCustomer({ ...form, balance: 0, status: "Active" });
      }
      setIsModalOpen(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save customer");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Customer",
      "Are you sure you want to delete this customer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCustomer(id);
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to delete customer",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Customer Management</Text>
          <Text style={styles.screenSubtitle}>
            View and manage customer details
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleOpenModal()}
        >
          <LinearGradient
            colors={["#0f172a", "#334155"]}
            style={styles.gradientButton}
          >
            <UserPlus size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ErrorBanner message={error} onRetry={() => fetchCustomers(20, 0)} />

      <FlashList<Customer>
        data={filteredCustomers}
        renderItem={({ item }) => (
          <CustomerItem
            customer={item}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
          />
        )}
        keyExtractor={(item) => item.id}
        // @ts-ignore
        estimatedItemSize={160}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={() => fetchMoreCustomers()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          isLoading && !refreshing && customers.length > 0 ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color="#2563eb" />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <UserRound size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No customers found</Text>
            <Text style={styles.emptyDesc}>
              Add a new customer to get started.
            </Text>
          </View>
        )}
      />

      <Modal visible={isModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCustomer ? "Edit Customer" : "New Customer"}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              {editingCustomer
                ? "Update customer details below."
                : "Enter details for the new customer."}
            </Text>

            <ScrollView style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    value={form.name}
                    onChangeText={(text) => setForm({ ...form, name: text })}
                    placeholder="John Doe"
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={20} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    value={form.phone}
                    onChangeText={(text) => setForm({ ...form, phone: text })}
                    placeholder="+91 9876543210"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    value={form.email}
                    onChangeText={(text) => setForm({ ...form, email: text })}
                    placeholder="john@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      height: 80,
                      alignItems: "flex-start",
                      paddingVertical: 12,
                    },
                  ]}
                >
                  <MapPin size={20} color="#64748b" style={{ marginTop: 2 }} />
                  <TextInput
                    style={[
                      styles.input,
                      { height: "100%", textAlignVertical: "top" },
                    ]}
                    value={form.address}
                    onChangeText={(text) => setForm({ ...form, address: text })}
                    placeholder="Street, City, Zip"
                    multiline
                    numberOfLines={3}
                  />
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
                  style={styles.createGradient}
                >
                  <Text style={styles.saveBtnText}>
                    {editingCustomer ? "Update Customer" : "Save Customer"}
                  </Text>
                  <ChevronRight size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  screenTitle: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
    fontFamily: "Outfit-Regular",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  gradientButton: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  searchSection: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
    height: "100%",
    fontFamily: "Outfit-Medium",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 16,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  avatarContainer: {
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontFamily: "Outfit-Bold",
    fontSize: 18,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 17,
    fontFamily: "Outfit-Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  balanceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  balanceText: {
    fontSize: 12,
    fontFamily: "Outfit-SemiBold",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoValue: {
    fontSize: 13,
    color: "#64748b",
    fontFamily: "Outfit-Medium",
  },
  cardFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  callButton: {
    backgroundColor: "#fff",
  },
  whatsappButton: {
    backgroundColor: "#25D366",
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: "Outfit-SemiBold",
    color: "#0f172a",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: "#1e293b",
  },
  emptyDesc: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    color: "#0f172a",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 24,
    fontFamily: "Outfit-Regular",
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "Outfit-SemiBold",
    color: "#334155",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    height: "100%",
    fontFamily: "Outfit-Medium",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  cancelBtnText: {
    fontSize: 16,
    fontFamily: "Outfit-SemiBold",
    color: "#64748b",
  },
  saveBtn: {
    flex: 2,
    height: 52,
    borderRadius: 12,
    overflow: "hidden",
  },
  createGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: "#fff",
  },
});
