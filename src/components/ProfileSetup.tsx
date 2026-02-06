import React, { useState } from "react";
import { useAuthStore, UserRole } from "../store/authStore";
import { User, Briefcase, AlertCircle } from "lucide-react";

export function ProfileSetup() {
  const { user, updateProfile, isLoading, error } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [role, setRole] = useState<UserRole>(user?.role || "sales");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!name.trim()) {
      setLocalError("Name is required");
      return;
    }

    try {
      await updateProfile(name, role);
    } catch (err: any) {
      setLocalError(err.message || "Failed to update profile");
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border border-border shadow-xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-primary">SV</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-muted-foreground">
            Please provide your name and role to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {displayError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-sm">
              <AlertCircle size={16} />
              {displayError}
            </div>
          )}

          {/* Name field */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-muted-foreground">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                required
              />
            </div>
          </div>

          {/* Role selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Role</label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-muted-foreground z-10">
                <Briefcase size={18} />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
              >
                <option value="admin">Admin</option>
                <option value="sales">Sales</option>
                <option value="warehouse">Warehouse</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Continue"}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          <p>Logged in as: {user?.email}</p>
        </div>
      </div>
    </div>
  );
}
