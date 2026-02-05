import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, UserRole } from "../store/authStore";
import { User, Lock, AlertCircle } from "lucide-react";

export default function Login() {
  const signIn = useAuthStore((state) => state.signIn);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Mock Authentication Logic
    let role: UserRole | null = null;
    const upperUser = username.toUpperCase().trim();

    if (upperUser === "ADMIN" && password === "admin123") {
      role = "admin";
    } else if (upperUser === "SALES" && password === "sales123") {
      role = "salesman";
    } else if (upperUser === "INVENTORY" && password === "inv123") {
      role = "inventory";
    }

    if (role) {
      signIn(role);
      // specific redirects for each role
      if (role === "admin") {
        navigate("/");
      } else if (role === "salesman") {
        navigate("/orders");
      } else if (role === "inventory") {
        navigate("/inventory");
      }
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border border-border shadow-xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-primary">SV</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 mt-8">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Username
            </label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-muted-foreground">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="ADMIN"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-muted-foreground">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground bg-muted/50 p-4 rounded-lg">
          <p className="font-semibold mb-2">Demo Credentials:</p>
          <div className="grid grid-cols-2 gap-2 text-left">
            <div>Admin:</div>
            <div>ADMIN / admin123</div>
            <div>Sales:</div>
            <div>SALES / sales123</div>
            <div>Inventory:</div>
            <div>INVENTORY / inv123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
