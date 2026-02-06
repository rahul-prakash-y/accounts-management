import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Power,
  Users,
  Settings,
  Shield,
  ShoppingBag,
  UserCircle,
  ArrowRightLeft,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "../store/authStore";
import { useSettingsStore } from "../store/settingsStore";

export default function Layout() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const companyDetails = useSettingsStore((s) => s.companySettings);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const allNavItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      to: "/",
      roles: ["admin", "super_admin"],
    },
    {
      icon: Shield,
      label: "Admins",
      to: "/admins",
      roles: ["super_admin"],
    },
    {
      icon: ShoppingCart,
      label: "Orders",
      to: "/orders",
      roles: ["admin", "super_admin", "sales", "warehouse"],
    },
    {
      icon: Package,
      label: "Inventory",
      to: "/inventory",
      roles: ["admin", "super_admin", "warehouse"],
    },
    {
      icon: ShoppingBag,
      label: "Purchases",
      to: "/purchases",
      roles: ["admin", "super_admin", "warehouse"],
    },
    {
      icon: Users,
      label: "Customers",
      to: "/customers",
      roles: ["admin", "super_admin", "sales"],
    },
    {
      icon: UserCircle,
      label: "Employees",
      to: "/employees",
      roles: ["admin", "super_admin"],
    },
    {
      icon: BarChart3,
      label: "Reports",
      to: "/reports",
      roles: ["admin", "super_admin", "warehouse"],
    },
    {
      icon: ArrowRightLeft,
      label: "Transactions",
      to: "/transactions",
      roles: ["admin", "super_admin", "warehouse"],
    },
    {
      icon: Settings,
      label: "Settings",
      to: "/settings",
      roles: ["admin", "super_admin"],
    },
  ];

  const navItems = allNavItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-20 bg-card border-r border-border flex flex-col items-center py-6 z-20 shadow-xl relative">
        <div className="mb-8 p-2 rounded-xl bg-primary/10 text-primary">
          <div className="font-bold text- lg h-8 w-8 flex items-center justify-center">
            SV
          </div>
        </div>

        <nav className="flex-1 w-full px-3 space-y-4 ">
          {navItems.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>

        <div className="mt-auto px-3 w-full">
          <button
            onClick={handleSignOut}
            className="w-full aspect-square flex items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 group relative"
          >
            <Power size={24} />
            {/* Tooltip */}
            <span className="absolute left-full ml-4 px-3 py-1.5 bg-foreground text-background text-xs font-semibold rounded-md opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap z-50 shadow-lg">
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10 font-medium">
          <h2 className="text-xl">{companyDetails?.name}</h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-sm font-bold">{user?.name}</div>
              <div className="text-xs text-muted-foreground capitalize">
                {user?.role}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: any;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "relative w-full aspect-square flex items-center justify-center rounded-2xl transition-all duration-300 group",
          isActive
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )
      }
    >
      <Icon size={24} strokeWidth={2} />

      {/* Modern Tooltip */}
      <span className="absolute left-full ml-4 px-3 py-1.5 bg-foreground text-background text-sm font-semibold rounded-lg opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap z-50 shadow-xl">
        {label}
        {/* Arrow */}
        <span className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-foreground"></span>
      </span>
    </NavLink>
  );
}
