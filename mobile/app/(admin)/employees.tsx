import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  StatusBar,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import {
  UserPlus,
  Search,
  Briefcase,
  MapPin,
  Trash2,
  Edit2,
  X,
  User as UserIcon,
  Building,
  Phone,
  MessageCircle,
  MoreVertical,
} from "lucide-react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useEmployeeStore, Employee } from "@/store/employeeStore";
import { SafeAreaView } from "react-native-safe-area-context";

const EmployeeItem = ({
  employee,
  onEdit,
  onDelete,
}: {
  employee: Employee;
  onEdit: (e: Employee) => void;
  onDelete: (id: string) => void;
}) => {
  const handleCall = () => {
    if (employee.phone) {
      Linking.openURL(`tel:${employee.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (employee.phone) {
      let phone = employee.phone.replace(/[^\d]/g, "");
      if (!phone.startsWith("91") && phone.length === 10) {
        phone = "91" + phone;
      }
      const url = `whatsapp://send?phone=${phone}`;
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            return Linking.openURL(`https://wa.me/${phone}`);
          }
        })
        .catch((err) => console.error("An error occurred", err));
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={["#eff6ff", "#dbeafe"]} style={styles.avatar}>
            <Text style={styles.avatarText}>
              {employee.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{employee.name}</Text>
            <View style={styles.roleTag}>
              <Briefcase size={12} color="#3b82f6" />
              <Text style={styles.roleText}>{employee.role}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onEdit(employee)}
          >
            <Edit2 size={16} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => onDelete(employee.id)}
          >
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Building size={14} color="#94a3b8" />
          <Text style={styles.infoValue}>{employee.department}</Text>
        </View>
        <View style={styles.infoRow}>
          <MapPin size={14} color="#94a3b8" />
          <Text style={styles.infoValue}>{employee.location}</Text>
        </View>
        {employee.phone && (
          <View style={styles.infoRow}>
            <Phone size={14} color="#94a3b8" />
            <Text style={styles.infoValue}>{employee.phone}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                employee.status === "Active" ? "#f0fdf4" : "#f1f5f9",
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  employee.status === "Active" ? "#22c55e" : "#94a3b8",
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: employee.status === "Active" ? "#16a34a" : "#64748b" },
            ]}
          >
            {employee.status}
          </Text>
        </View>

        <View style={styles.contactActions}>
          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: "#eff6ff" }]}
            onPress={handleCall}
            disabled={!employee.phone}
          >
            <Phone size={16} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: "#f0fdf4" }]}
            onPress={handleWhatsApp}
            disabled={!employee.phone}
          >
            <FontAwesome name="whatsapp" size={18} color="#22c55e" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function EmployeesScreen() {
  const {
    employees,
    isLoading,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  } = useEmployeeStore();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<Partial<Employee>>({
    name: "",
    role: "",
    department: "",
    location: "",
    status: "Active",
    phone: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
    setRefreshing(false);
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.role.toLowerCase().includes(search.toLowerCase()) ||
        e.department.toLowerCase().includes(search.toLowerCase()),
    );
  }, [employees, search]);

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setForm({
        name: employee.name,
        role: employee.role,
        department: employee.department,
        location: employee.location,
        status: employee.status,
        phone: employee.phone || "",
      });
    } else {
      setEditingEmployee(null);
      setForm({
        name: "",
        role: "",
        department: "",
        location: "",
        status: "Active",
        phone: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.role) {
      // Basic validation
      return;
    }

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, form);
      } else {
        await addEmployee(form);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Employees</Text>
        <Text style={styles.headerSubtitle}>Manage your team members</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, role, department..."
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

      <FlashList<Employee>
        data={filteredEmployees}
        renderItem={({ item }) => (
          <EmployeeItem
            employee={item}
            onEdit={handleOpenModal}
            onDelete={deleteEmployee}
          />
        )}
        keyExtractor={(item) => item.id}
        // @ts-ignore
        estimatedItemSize={150}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#2563eb" />
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <UserIcon size={32} color="#94a3b8" />
                </View>
                <Text style={styles.emptyText}>No employees found</Text>
                <Text style={styles.emptySubtext}>
                  Add a new employee to get started
                </Text>
              </View>
            )}
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
                {editingEmployee ? "Edit Employee" : "New Employee"}
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <UserIcon
                    size={18}
                    color="#64748b"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={form.name}
                    onChangeText={(text) => setForm({ ...form, name: text })}
                    placeholder="e.g. John Doe"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Role / Position</Text>
                <View style={styles.inputContainer}>
                  <Briefcase
                    size={18}
                    color="#64748b"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={form.role}
                    onChangeText={(text) => setForm({ ...form, role: text })}
                    placeholder="e.g. Sales Manager"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Department</Text>
                  <View style={styles.inputContainer}>
                    <Building
                      size={18}
                      color="#64748b"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={form.department}
                      onChangeText={(text) =>
                        setForm({ ...form, department: text })
                      }
                      placeholder="e.g. Sales"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Location</Text>
                  <View style={styles.inputContainer}>
                    <MapPin
                      size={18}
                      color="#64748b"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={form.location}
                      onChangeText={(text) =>
                        setForm({ ...form, location: text })
                      }
                      placeholder="e.g. NY Office"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputContainer}>
                  <Phone size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={form.phone}
                    onChangeText={(text) => setForm({ ...form, phone: text })}
                    placeholder="e.g. +91 9876543210"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusRow}>
                  {["Active", "Inactive"].map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusOption,
                        form.status === s && styles.statusOptionActive,
                      ]}
                      onPress={() => setForm({ ...form, status: s })}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          form.status === s && styles.statusOptionTextActive,
                        ]}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
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
                  <Text style={styles.saveBtnText}>Save Details</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <TouchableOpacity
        style={styles.fabContainer}
        onPress={() => handleOpenModal()}
        activeOpacity={0.8}
      >
        <LinearGradient colors={["#2563eb", "#1d4ed8"]} style={styles.fab}>
          <UserPlus size={24} color="white" />
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
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  headerLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  avatarText: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    color: "#2563eb",
  },
  headerInfo: {
    justifyContent: "center",
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: "#1e293b",
  },
  roleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  roleText: {
    fontSize: 11,
    color: "#2563eb",
    fontFamily: "Outfit-SemiBold",
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
  cardBody: {
    padding: 16,
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
    padding: 16,
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Outfit-SemiBold",
  },
  contactActions: {
    flexDirection: "row",
    gap: 8,
  },
  contactBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
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
  closeButton: {
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
  statusRow: {
    flexDirection: "row",
    gap: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
    backgroundColor: "white",
  },
  statusOptionActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
  },
  statusOptionText: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "Outfit-SemiBold",
  },
  statusOptionTextActive: {
    color: "#2563eb",
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
