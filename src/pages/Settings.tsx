import { useState, useEffect } from "react";
import { Save, Database, Download, Upload, RefreshCw } from "lucide-react";
import { useDataStore, CompanySettings } from "../store/dataStore";
import { Toast } from "../components/Toast";

export default function Settings() {
  const companySettings = useDataStore((state) => state.companySettings);
  const updateCompanySettings = useDataStore(
    (state) => state.updateCompanySettings,
  );

  const [formData, setFormData] = useState<CompanySettings>({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    website: "",
  });

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Load initial data
  useEffect(() => {
    if (companySettings) {
      setFormData(companySettings);
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
