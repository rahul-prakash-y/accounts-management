import { useState, useEffect } from "react";
import {
  Save,
  Database,
  Download,
  Upload,
  Building2,
  Plus,
  Trash,
  Edit,
  Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import {
  useSettingsStore,
  CompanySettings,
  SubCompany,
} from "../store/settingsStore";
import { Toast } from "../components/Toast";
import { Modal } from "../components/Modal";

export default function Settings() {
  const companySettings = useSettingsStore((state) => state.companySettings);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);
  const updateCompanySettings = useSettingsStore(
    (state) => state.updateCompanySettings,
  );
  const subCompanies = useSettingsStore((state) => state.subCompanies);
  const addSubCompany = useSettingsStore((state) => state.addSubCompany);
  const updateSubCompany = useSettingsStore((state) => state.updateSubCompany);
  const deleteSubCompany = useSettingsStore((state) => state.deleteSubCompany);

  const [formData, setFormData] = useState<CompanySettings>({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    gstNo: "",
  });

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Sub-company State
  const [isSubCompanyModalOpen, setIsSubCompanyModalOpen] = useState(false);
  const [editingSubCompany, setEditingSubCompany] = useState<SubCompany | null>(
    null,
  );
  const [subCompanyForm, setSubCompanyForm] = useState<SubCompany>({
    id: "",
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    gstNo: "",
  });

  // Load initial data
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (companySettings) {
      setFormData({
        ...companySettings,
        gstNo: companySettings.gstNo || "",
      });
    }
  }, [companySettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: CompanySettings) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCompanySettings(formData);
      setToast({ message: "Settings saved successfully!", type: "success" });
    } catch (error) {
      setToast({ message: "Failed to save settings.", type: "error" });
    }
  };

  // Sub-company Handlers
  const handleOpenSubCompanyModal = (subCompany?: SubCompany) => {
    if (subCompany) {
      setEditingSubCompany(subCompany);
      setSubCompanyForm({
        ...subCompany,
        gstNo: subCompany.gstNo || "",
      });
    } else {
      setEditingSubCompany(null);
      setSubCompanyForm({
        id: "",
        name: "",
        address: "",
        city: "",
        phone: "",
        email: "",
        website: "",
        gstNo: "",
      });
    }
    setIsSubCompanyModalOpen(true);
  };

  const handleSaveSubCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubCompany) {
        await updateSubCompany(editingSubCompany.id, subCompanyForm);
        setToast({
          message: "Sub-company updated successfully!",
          type: "success",
        });
      } else {
        await addSubCompany(subCompanyForm);
        setToast({
          message: "Sub-company added successfully!",
          type: "success",
        });
      }
      setIsSubCompanyModalOpen(false);
    } catch (error) {
      setToast({ message: "Failed to save sub-company.", type: "error" });
    }
  };

  const handleDeleteSubCompany = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this sub-company?")) {
      try {
        await deleteSubCompany(id);
        setToast({
          message: "Sub-company deleted successfully!",
          type: "success",
        });
      } catch (error) {
        setToast({ message: "Failed to delete sub-company.", type: "error" });
      }
    }
  };

  // Data Actions
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const tables = [
        "customers",
        "employees",
        "products",
        "company_settings",
        "sub_companies",
        "orders",
        "order_items",
        "purchases",
        "purchase_items",
        "transactions",
        "system_logs",
      ];

      const backupData: Record<string, any> = {
        version: "2.0",
        timestamp: new Date().toISOString(),
      };

      await Promise.all(
        tables.map(async (table) => {
          const { data, error } = await supabase.from(table).select("*");
          if (error) {
            console.error(`Error backing up table ${table}:`, error);
            return;
          }
          backupData[table] = data;
        }),
      );

      // 2. Request Save Path from User
      const filePath = await save({
        filters: [
          {
            name: "JSON",
            extensions: ["json"],
          },
        ],
        defaultPath: `inventory_backup_${new Date().toISOString().split("T")[0]}.json`,
      });

      if (!filePath) {
        setIsBackingUp(false);
        return; // User cancelled
      }

      // 3. Write File using Tauri FS
      await writeTextFile(filePath, JSON.stringify(backupData, null, 2));

      setToast({ message: "Backup saved successfully!", type: "success" });
    } catch (error) {
      console.error("Backup failed:", error);
      setToast({ message: "Backup failed. Please try again.", type: "error" });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = () => {
    // Just a placeholder for actual file upload logic
    setToast({ message: "Restore functionality coming soon.", type: "error" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Company Information Form */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6 text-lg font-semibold border-b border-border pb-2">
          Settings
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your Company Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <input
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="www.example.com"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Address</label>
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Street Address"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">City, State, Zip</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="City, State 12345"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="(123) 456-7890"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="support@company.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">GST No.</label>
              <input
                name="gstNo"
                value={formData.gstNo || ""}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="GSTIN"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary/90 transition-colors font-medium"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Sub-companies Management Section */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-6 border-b border-border pb-2">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Building2 size={20} className="text-primary" />
            Sub-companies Management
          </div>
          <button
            onClick={() => handleOpenSubCompanyModal()}
            className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Add New
          </button>
        </div>

        {subCompanies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
            No sub-companies configured. Orders will use the main company
            details.
          </div>
        ) : (
          <div className="grid gap-4">
            {subCompanies.map((sc) => (
              <div
                key={sc.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-border hover:bg-muted/20 transition-colors"
              >
                <div>
                  <h3 className="font-medium text-foreground">{sc.name}</h3>
                  <p className="text-sm text-muted-foreground">{sc.city}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenSubCompanyModal(sc)}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteSubCompany(sc.id)}
                    className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Management Section */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6 text-lg font-semibold border-b border-border pb-2">
          <Database size={20} className="text-primary" />
          Data Management
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-4">
            <div className="font-medium flex items-center gap-2">
              <Download size={16} /> Backup Data
            </div>
            <p className="text-sm text-muted-foreground">
              Download a JSON backup of all your application data.
            </p>
            <button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="text-sm bg-secondary text-secondary-foreground px-3 py-2 rounded-md hover:bg-secondary/80 w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isBackingUp ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Preparing...
                </>
              ) : (
                "Download Backup"
              )}
            </button>
          </div>

          <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-4">
            <div className="font-medium flex items-center gap-2">
              <Upload size={16} /> Restore Data
            </div>
            <p className="text-sm text-muted-foreground">
              Restore data from a backup file. (Caution: Overwrites current
              data)
            </p>
            <button
              onClick={handleRestore}
              className="text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md w-full"
            >
              Restore from File
            </button>
          </div>
        </div>
      </div>

      {/* Sub-company Modal */}
      <Modal
        isOpen={isSubCompanyModalOpen}
        onClose={() => setIsSubCompanyModalOpen(false)}
        title={editingSubCompany ? "Edit Sub-company" : "Add Sub-company"}
      >
        <form onSubmit={handleSaveSubCompany} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <input
              value={subCompanyForm.name}
              onChange={(e) =>
                setSubCompanyForm({ ...subCompanyForm, name: e.target.value })
              }
              className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <input
              value={subCompanyForm.address}
              onChange={(e) =>
                setSubCompanyForm({
                  ...subCompanyForm,
                  address: e.target.value,
                })
              }
              className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <input
                value={subCompanyForm.city}
                onChange={(e) =>
                  setSubCompanyForm({ ...subCompanyForm, city: e.target.value })
                }
                className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <input
                value={subCompanyForm.phone}
                onChange={(e) =>
                  setSubCompanyForm({
                    ...subCompanyForm,
                    phone: e.target.value,
                  })
                }
                className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                value={subCompanyForm.email}
                onChange={(e) =>
                  setSubCompanyForm({
                    ...subCompanyForm,
                    email: e.target.value,
                  })
                }
                className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <input
                value={subCompanyForm.website}
                onChange={(e) =>
                  setSubCompanyForm({
                    ...subCompanyForm,
                    website: e.target.value,
                  })
                }
                className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">GST No.</label>
            <input
              value={subCompanyForm.gstNo || ""}
              onChange={(e) =>
                setSubCompanyForm({
                  ...subCompanyForm,
                  gstNo: e.target.value,
                })
              }
              className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="GSTIN"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsSubCompanyModalOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
