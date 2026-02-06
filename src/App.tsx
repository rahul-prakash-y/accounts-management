import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Loader } from "lucide-react";
import { useAuthStore } from "./store/authStore";

// Lazy Load Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Orders = lazy(() => import("./pages/Orders"));
const Purchases = lazy(() => import("./pages/Purchases"));
const PurchaseForm = lazy(() => import("./pages/PurchaseForm"));
const Inventory = lazy(() => import("./pages/Inventory"));
const InventoryForm = lazy(() => import("./pages/InventoryForm"));
const Reports = lazy(() => import("./pages/Reports"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerForm = lazy(() => import("./pages/CustomerForm"));
const Employees = lazy(() => import("./pages/Employees"));
const EmployeeForm = lazy(() => import("./pages/EmployeeForm"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Transactions = lazy(() => import("./pages/Transactions"));
const OrderForm = lazy(() => import("./pages/OrderForm"));
const Login = lazy(() => import("./pages/Login"));
const Settings = lazy(() => import("./pages/Settings"));
const Admins = lazy(() => import("./pages/Admins"));

// Wrapper component to redirect authenticated users away from login
function LoginRoute() {
  const { isAuthenticated, user, checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isAuthenticated && user) {
    console.log(
      "🔄 LoginRoute: User is authenticated, redirecting based on role:",
      user.role,
    );
    // Redirect based on role
    if (user.role === "admin" || user.role === "super_admin") {
      return <Navigate to="/" replace />;
    } else if (user.role === "sales") {
      return <Navigate to="/orders" replace />;
    } else if (user.role === "warehouse") {
      return <Navigate to="/inventory" replace />;
    }
    return <Navigate to="/orders" replace />;
  }

  return <Login />;
}

function App() {
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <BrowserRouter>
      {/* QA Sandbox Overlay - Always visible in this build */}
      {/* <DebugOverlay /> */}

      <Suspense
        fallback={
          <div className="flex h-screen w-full items-center justify-center">
            <Loader className="size-4 animate-spin" />
          </div>
        }
      >
        <Routes>
          <Route path="/login" element={<LoginRoute />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              {/* Super Admin Only Routes */}
              <Route
                element={<ProtectedRoute allowedRoles={["super_admin"]} />}
              >
                <Route path="/admins" element={<Admins />} />
              </Route>

              {/* Admin & Super Admin Routes */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["admin", "super_admin"]} />
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/employees/new" element={<EmployeeForm />} />
                <Route path="/employees/edit/:id" element={<EmployeeForm />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["sales", "super_admin", "admin"]}
                  />
                }
              >
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/new" element={<CustomerForm />} />
                <Route path="/customers/edit/:id" element={<CustomerForm />} />
              </Route>

              {/* Shared Routes (Admin, Sales, Warehouse) */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "admin",
                      "super_admin",
                      "sales",
                      "warehouse",
                    ]}
                  />
                }
              >
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/new" element={<OrderForm />} />
                <Route path="/orders/edit/:id" element={<OrderForm />} />
              </Route>

              {/* Inventory & Admin Routes */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "super_admin", "warehouse"]}
                  />
                }
              >
                <Route path="/purchases" element={<Purchases />} />
                <Route path="/purchases/new" element={<PurchaseForm />} />
                <Route path="/purchases/edit/:id" element={<PurchaseForm />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/inventory/new" element={<InventoryForm />} />
                <Route path="/inventory/edit/:id" element={<InventoryForm />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/transactions" element={<Transactions />} />
              </Route>

              {/* Catch all - 404 page */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
