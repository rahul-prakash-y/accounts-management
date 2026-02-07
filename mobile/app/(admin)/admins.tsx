import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import {
  UserPlus,
  Shield,
  ShieldAlert,
  Trash2,
  X,
  Search,
  User,
  Lock,
  ChevronRight,
  ShieldCheck,
} from "lucide-react-native";
import { useAdminStore, AdminUser } from "@/store/adminStore";
import { useAuthStore } from "@/store/authStore";

export default function AdminsScreen() {
  const { user } = useAuthStore();
  const { admins, isLoading, fetchAdmins, addAdmin, deleteAdmin } =
    useAdminStore();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async () => {
    if (!formData.username || !formData.password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      await addAdmin(formData.username, formData.password);
      setIsModalVisible(false);
      setFormData({ username: "", password: "" });
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDeleteAdmin = (id: string, username: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete admin "${username}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAdmin(id);
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ],
    );
  };

  const filteredAdmins = admins.filter((admin) =>
    admin.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderAdminItem = ({ item }: { item: AdminUser }) => (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={
                item.role === "super_admin"
                  ? ["#7c3aed", "#6d28d9"]
                  : ["#3b82f6", "#2563eb"]
              }
              style={styles.avatarGradient}
            >
              {item.role === "super_admin" ? (
                <ShieldAlert size={20} color="#fff" />
              ) : (
                <ShieldCheck size={20} color="#fff" />
              )}
            </LinearGradient>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.username}</Text>
            <View style={styles.roleBadge}>
              <Text
                style={[
                  styles.roleText,
                  item.role === "super_admin" && styles.superAdminText,
                ]}
              >
                {item.role === "super_admin" ? "Super Admin" : "Administrator"}
              </Text>
            </View>
          </View>
          {user?.role === "super_admin" && item.id !== user?.id && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteAdmin(item.id, item.username)}
            >
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.activityIndicator}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Active Account</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Admin Management</Text>
          <Text style={styles.screenSubtitle}>
            Manage system administrators and roles
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
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
            placeholder="Search administrators..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List Section */}
      <FlashList
        data={filteredAdmins}
        renderItem={renderAdminItem}
        estimatedItemSize={120}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Shield size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No admins found</Text>
            <Text style={styles.emptyDesc}>
              Use the 'Add New' button to create an administrator.
            </Text>
          </View>
        }
      />

      {/* Add Admin Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Administrator</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Create a new account with administrative privileges.
            </Text>

            <ScrollView style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter username"
                    value={formData.username}
                    onChangeText={(text) =>
                      setFormData({ ...formData, username: text })
                    }
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter secure password"
                    value={formData.password}
                    onChangeText={(text) =>
                      setFormData({ ...formData, password: text })
                    }
                    secureTextEntry
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleAddAdmin}
              >
                <LinearGradient
                  colors={["#2563eb", "#1d4ed8"]}
                  style={styles.createGradient}
                >
                  <Text style={styles.createButtonText}>Create Account</Text>
                  <ChevronRight size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      )}
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
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 17,
    fontFamily: "Outfit-Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: "row",
  },
  roleText: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Outfit-Medium",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  superAdminText: {
    color: "#7c3aed",
    backgroundColor: "#f3e8ff",
  },
  deleteButton: {
    padding: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
  },
  activityIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  statusText: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Outfit-Medium",
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
    maxHeight: "80%",
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
  cancelButton: {
    flex: 1,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Outfit-SemiBold",
    color: "#64748b",
  },
  createButton: {
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
  createButtonText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: "#fff",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
});
