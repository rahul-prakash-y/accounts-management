import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";

import Orders from "./pages/Orders";
import Purchases from "./pages/Purchases";
import PurchaseForm from "./pages/PurchaseForm";
import Inventory from "./pages/Inventory";
import InventoryForm from "./pages/InventoryForm";
import Reports from "./pages/Reports";
import Customers from "./pages/Customers";
import CustomerForm from "./pages/CustomerForm";
import Employees from "./pages/Employees";
import EmployeeForm from "./pages/EmployeeForm";
import NotFound from "./pages/NotFound";
import Transactions from "./pages/Transactions";

import OrderForm from "./pages/OrderForm";

import Login from "./pages/Login";
import Settings from "./pages/Settings";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route index element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/new" element={<CustomerForm />} />
              <Route path="/customers/edit/:id" element={<CustomerForm />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/employees/new" element={<EmployeeForm />} />
              <Route path="/employees/edit/:id" element={<EmployeeForm />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Shared Routes (Admin, Salesman, Inventory) */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "salesman", "inventory"]}
                />
              }
            >
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/new" element={<OrderForm />} />
              <Route path="/orders/edit/:id" element={<OrderForm />} />
            </Route>

            {/* Inventory & Admin Routes */}
            <Route
              element={<ProtectedRoute allowedRoles={["admin", "inventory"]} />}
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
    </BrowserRouter>
  );
}

export default App;
