import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, UserRole } from "../store/authStore";
import {
  ShieldCheck,
  Warehouse,
  TrendingUp,
  Lock,
  ArrowLeft,
} from "lucide-react";

export default function Login() {
  const { simpleSignIn, adminSignIn, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleRoleSelect = (role: UserRole) => {
    if (role === "admin") {
      setIsAdminLogin(true);
      return;
    }

    console.log("🔐 Signing in as:", role);
    simpleSignIn(role);

    // Navigate based on role
    if (role === "sales") {
      navigate("/orders");
    } else if (role === "warehouse") {
      navigate("/inventory");
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    try {
      await adminSignIn(username, password);
      navigate("/");
    } catch (err: any) {
      setLocalError(err.message || "Invalid credentials");
    }
  };

  const roles = [
    {
      value: "admin" as UserRole,
      label: "Admin",
      description: "Full system access",
      icon: ShieldCheck,
      color: "from-purple-500 to-indigo-600",
    },
    {
      value: "warehouse" as UserRole,
      label: "Warehouse",
      description: "Inventory & purchases",
      icon: Warehouse,
      color: "from-blue-500 to-cyan-600",
    },
    {
      value: "sales" as UserRole,
      label: "Sales",
      description: "Orders & customers",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-600",
    },
  ];

  if (isAdminLogin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border border-border shadow-xl">
          <div className="flex items-center mb-6">
            <button
              onClick={() => {
                setIsAdminLogin(false);
                setLocalError("");
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold ml-4">Admin Login</h2>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-6">
            {(localError || error) && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {localError || error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-muted-foreground">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-3xl font-bold text-primary">SV</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight">Welcome</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Select your role to continue
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.value}
                onClick={() => handleRoleSelect(role.value)}
                onMouseEnter={() => setSelectedRole(role.value)}
                onMouseLeave={() => setSelectedRole(null)}
                className={`group relative overflow-hidden bg-card border-2 rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  selectedRole === role.value
                    ? "border-primary shadow-xl"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                  <div
                    className={`h-16 w-16 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold mb-2">{role.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </div>

                  <div className="pt-4">
                    <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Click to sign in →
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg max-w-2xl mx-auto">
          <p>
            <strong>Demo Mode:</strong> No authentication required. Simply
            select a role to access the system.
          </p>
        </div>
      </div>
    </div>
  );
}
