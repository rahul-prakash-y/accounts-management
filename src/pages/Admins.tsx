import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { Trash2, UserPlus, Shield, ShieldAlert, Loader } from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

export default function Admins() {
  const { user } = useAuthStore();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New admin form state
  const [isAdding, setIsAdding] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("admins")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (err: any) {
      console.error("Error fetching admins:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Create new admin
      const { error } = await supabase.from("admins").insert([
        {
          username: newUsername,
          password: newPassword, // Note: In production, hash this!
          role: "admin", // Default role
        },
      ]);

      if (error) throw error;

      // Reset form and refresh list
      setNewUsername("");
      setNewPassword("");
      setIsAdding(false);
      fetchAdmins();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;

    try {
      const { error } = await supabase.from("admins").delete().eq("id", id);

      if (error) throw error;
      fetchAdmins();
    } catch (err: any) {
      alert("Error deleting admin: " + err.message);
    }
  };

  if (isLoading && admins.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admins</h1>
          <p className="text-muted-foreground">
            Manage admin access and permissions
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="mr-2 size-4" />
          {isAdding ? "Cancel" : "Add Admin"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="rounded-lg border bg-card p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-semibold mb-4">Add New Admin</h2>
          <form onSubmit={handleAddAdmin} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Create Admin"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-md border bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                  Username
                </th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                  Role
                </th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                  Created At
                </th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {admins.map((admin) => (
                <tr
                  key={admin.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <td className="p-4 align-middle font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {admin.role === "super_admin" ? (
                          <ShieldAlert className="size-4 text-primary" />
                        ) : (
                          <Shield className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      {admin.username}
                      {user?.id === admin.id && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (You)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        admin.role === "super_admin"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-100 dark:text-purple-500"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-200 dark:text-gray-600"
                      }`}
                    >
                      {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-muted-foreground">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 align-middle text-right">
                    {admin.role !== "super_admin" && (
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Delete Admin"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-4 text-center text-muted-foreground"
                  >
                    No admins found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
