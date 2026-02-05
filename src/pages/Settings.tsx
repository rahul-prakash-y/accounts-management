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
} from "lucide-react";
import { useDataStore, CompanySettings, SubCompany } from "../store/dataStore";
import { Toast } from "../components/Toast";
import { Modal } from "../components/Modal";

export default function Settings() {
  const companySettings = useDataStore((state) => state.companySettings);
  const updateCompanySettings = useDataStore(
    (state) => state.updateCompanySettings,
  );
  const subCompanies = useDataStore((state) => state.subCompanies);
  const addSubCompany = useDataStore((state) => state.addSubCompany);
  const updateSubCompany = useDataStore((state) => state.updateSubCompany);
  const deleteSubCompany = useDataStore((state) => state.deleteSubCompany);

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
    if (companySettings) {
      setFormData({
        ...companySettings,
        gstNo: companySettings.gstNo || "",
      });
    }
  }, [companySettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(formData);
    setToast({ message: "Settings saved successfully!", type: "success" });
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

  const handleSaveSubCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubCompany) {
      updateSubCompany(editingSubCompany.id, subCompanyForm);
      setToast({
        message: "Sub-company updated successfully!",
        type: "success",
      });
    } else {
      const newSubCompany = {
        ...subCompanyForm,
        id: `SC-${Date.now()}`,
      };
      addSubCompany(newSubCompany);
      setToast({ message: "Sub-company added successfully!", type: "success" });
    }
    setIsSubCompanyModalOpen(false);
  };

  const handleDeleteSubCompany = (id: string) => {
    if (window.confirm("Are you sure you want to delete this sub-company?")) {
      deleteSubCompany(id);
      setToast({
        message: "Sub-company deleted successfully!",
        type: "success",
      });
    }
  };

  // Mock Data Actions
  const handleBackup = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(localStorage));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "backup.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setToast({ message: "Backup downloaded successfully!", type: "success" });
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
              className="text-sm bg-secondary text-secondary-foreground px-3 py-2 rounded-md hover:bg-secondary/80 w-full"
            >
              Download Backup
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
