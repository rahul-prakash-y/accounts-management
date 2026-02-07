import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Save,
  Building,
  Plus,
  Edit2,
  Trash2,
  Globe,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  X,
  ChevronRight,
  Briefcase,
} from "lucide-react-native";
import {
  useSettingsStore,
  CompanySettings,
  SubCompany,
} from "@/store/settingsStore";

// --- Design Tokens (Consistent with Reports) ---
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
  inputBg: "#f8fafc",
  focusRing: "#c7d2fe", // Indigo 200
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

const FormInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon: Icon,
  keyboardType = "default",
}: any) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}
      >
        {Icon && (
          <Icon
            size={18}
            color={isFocused ? COLORS.primary : COLORS.textSecondary}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
    </View>
  );
};

export default function SettingsScreen() {
  const {
    companySettings,
    subCompanies,
    loading,
    fetchSettings,
    updateCompanySettings,
    addSubCompany,
    updateSubCompany,
    deleteSubCompany,
  } = useSettingsStore();

  const [formData, setFormData] = useState<CompanySettings>({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    gstNo: "",
  });

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubCompany | null>(null);
  const [subForm, setSubForm] = useState<Omit<SubCompany, "id">>({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    gstNo: "",
  });

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (companySettings) {
      setFormData(companySettings);
    }
  }, [companySettings]);

  const handleSaveCompany = async () => {
    try {
      await updateCompanySettings(formData);
      Alert.alert("Success", "Company settings updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update settings");
    }
  };

  const handleOpenSubModal = (sub?: SubCompany) => {
    if (sub) {
      setEditingSub(sub);
      setSubForm({
        name: sub.name,
        address: sub.address,
        city: sub.city,
        phone: sub.phone,
        email: sub.email,
        website: sub.website,
        gstNo: sub.gstNo,
      });
    } else {
      setEditingSub(null);
      setSubForm({
        name: "",
        address: "",
        city: "",
        phone: "",
        email: "",
        website: "",
        gstNo: "",
      });
    }
    setIsSubModalOpen(true);
  };

  const handleSaveSub = async () => {
    if (!subForm.name) {
      Alert.alert("Error", "Company name is required");
      return;
    }

    try {
      if (editingSub) {
        await updateSubCompany(editingSub.id, subForm);
      } else {
        await addSubCompany(subForm);
      }
      setIsSubModalOpen(false);
      Alert.alert(
        "Success",
        `Sub-company ${editingSub ? "updated" : "added"} successfully`,
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save sub-company");
    }
  };

  const handleDeleteSub = (id: string) => {
    Alert.alert(
      "Delete Sub-company",
      "Are you sure you want to delete this sub-company?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSubCompany(id);
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to delete sub-company",
              );
            }
          },
        },
      ],
    );
  };

  if (loading && !companySettings.name) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>
              Manage company profile and branches
            </Text>
          </View>

          {/* Company Info Section */}
          <View style={[styles.section, SHADOWS.small]}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconBox}>
                <Building size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionTitle}>Company Profile</Text>
            </View>

            <FormInput
              label="Company Name"
              value={formData.name}
              onChangeText={(text: string) =>
                setFormData({ ...formData, name: text })
              }
              placeholder="Official Name"
              icon={Briefcase}
            />
            <FormInput
              label="Address"
              value={formData.address}
              onChangeText={(text: string) =>
                setFormData({ ...formData, address: text })
              }
              placeholder="Street Address"
              icon={MapPin}
            />
            <FormInput
              label="City, State, Zip"
              value={formData.city}
              onChangeText={(text: string) =>
                setFormData({ ...formData, city: text })
              }
              placeholder="City, State Zip"
              icon={MapPin}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FormInput
                  label="Phone"
                  value={formData.phone}
                  onChangeText={(text: string) =>
                    setFormData({ ...formData, phone: text })
                  }
                  placeholder="Phone No."
                  icon={Phone}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <FormInput
                  label="GST No."
                  value={formData.gstNo}
                  onChangeText={(text: string) =>
                    setFormData({ ...formData, gstNo: text })
                  }
                  placeholder="GSTIN"
                  icon={CheckCircle2}
                />
              </View>
            </View>

            <FormInput
              label="Email"
              value={formData.email}
              onChangeText={(text: string) =>
                setFormData({ ...formData, email: text })
              }
              placeholder="contact@company.com"
              icon={Mail}
              keyboardType="email-address"
            />
            <FormInput
              label="Website"
              value={formData.website}
              onChangeText={(text: string) =>
                setFormData({ ...formData, website: text })
              }
              placeholder="www.company.com"
              icon={Globe}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveCompany}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Save size={18} color="white" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Sub-Companies Section */}
          <View style={[styles.section, SHADOWS.small]}>
            <View style={styles.sectionHeaderBetween}>
              <View style={styles.sectionHeaderTitle}>
                <View style={[styles.iconBox, { backgroundColor: "#ecfdf5" }]}>
                  <Building size={20} color={COLORS.secondary} />
                </View>
                <Text style={styles.sectionTitle}>Sub-Companies</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleOpenSubModal()}
                activeOpacity={0.7}
              >
                <Plus size={16} color="white" />
                <Text style={styles.addButtonText}>Add New</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listContainer}>
              {subCompanies.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No sub-companies configured.
                  </Text>
                </View>
              ) : (
                subCompanies.map((sc) => (
                  <View key={sc.id} style={styles.subCard}>
                    <View style={styles.subCardContent}>
                      <View style={styles.subIcon}>
                        <Building size={20} color={COLORS.textSecondary} />
                      </View>
                      <View style={styles.subInfo}>
                        <Text style={styles.subName}>{sc.name}</Text>
                        <Text style={styles.subCity}>
                          {sc.city || "No location set"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.subActions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleOpenSubModal(sc)}
                      >
                        <Edit2 size={16} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() => handleDeleteSub(sc.id)}
                      >
                        <Trash2 size={16} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sub Company Modal */}
      <Modal visible={isSubModalOpen} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, SHADOWS.medium]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSub ? "Edit Sub-company" : "New Sub-company"}
              </Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setIsSubModalOpen(false)}
              >
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <FormInput
                label="Name"
                value={subForm.name}
                onChangeText={(text: string) =>
                  setSubForm({ ...subForm, name: text })
                }
                placeholder="branch Name"
                icon={Building}
              />
              <FormInput
                label="Address"
                value={subForm.address}
                onChangeText={(text: string) =>
                  setSubForm({ ...subForm, address: text })
                }
                placeholder="Address"
                icon={MapPin}
              />
              <FormInput
                label="City"
                value={subForm.city}
                onChangeText={(text: string) =>
                  setSubForm({ ...subForm, city: text })
                }
                placeholder="City"
                icon={MapPin}
              />
              <FormInput
                label="Phone"
                value={subForm.phone}
                onChangeText={(text: string) =>
                  setSubForm({ ...subForm, phone: text })
                }
                placeholder="Phone"
                keyboardType="phone-pad"
                icon={Phone}
              />
              <FormInput
                label="GST No."
                value={subForm.gstNo}
                onChangeText={(text: string) =>
                  setSubForm({ ...subForm, gstNo: text })
                }
                placeholder="GSTIN"
                icon={CheckCircle2}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setIsSubModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={handleSaveSub}
              >
                <Text style={styles.modalSaveText}>Save Details</Text>
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
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "Outfit-Medium",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  sectionHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: "Outfit-SemiBold",
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 50,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: "white",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    color: COLORS.textPrincipal,
    fontSize: 15,
    fontFamily: "Outfit-Medium",
  },
  row: {
    flexDirection: "row",
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 14,
    marginTop: 12,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  addButtonText: {
    color: "white",
    fontSize: 13,
    fontFamily: "Outfit-Bold",
  },
  listContainer: {
    gap: 12,
  },
  emptyState: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: "Outfit-Medium",
  },
  subCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subCardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  subIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    justifyContent: "center",
    alignItems: "center",
  },
  subInfo: {
    flex: 1,
  },
  subName: {
    fontSize: 15,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
  },
  subCity: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  subActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    backgroundColor: "#fef2f2",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)", // Slate 900 with opacity
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    maxHeight: "85%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    color: COLORS.textPrincipal,
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: COLORS.inputBg,
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: "white",
  },
  modalCancel: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontFamily: "Outfit-Bold",
  },
  modalSave: {
    flex: 2,
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: {
    color: "white",
    fontSize: 15,
    fontFamily: "Outfit-Bold",
  },
});
