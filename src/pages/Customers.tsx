import { useMemo, useState } from "react";
import { Plus, Search, Edit3, Trash, Users, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable, ColumnDef } from "../components/DataTable";
import { DeleteConfirmationModal } from "../components/DeleteConfirmationModal";
import { Toast } from "../components/Toast";
import { useDataStore } from "../store/dataStore";

export default function Customers() {
  const navigate = useNavigate();
  const customers = useDataStore((state) => state.customers);
  const deleteCustomerFromStore = useDataStore((state) => state.deleteCustomer);

  const [deleteCustomer, setDeleteCustomer] = useState<
    (typeof customers)[0] | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const columns = useMemo<ColumnDef<(typeof customers)[0]>[]>(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        className: "flex-1 font-mono text-muted-foreground",
      },
      {
        header: "Name",
        className: "flex-1 font-medium",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              {info.name.substring(0, 2).toUpperCase()}
            </div>
            {info.name}
          </div>
        ),
      },
      {
        header: "Contact",
        className: "flex-1",
        cell: (info) => (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Mail size={12} /> {info.email}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Phone size={12} /> {info.phone}
            </div>
          </div>
        ),
      },
      {
        header: "Balance",
        accessorKey: "balance",
        className: "flex-[2] font-mono text-right",
        cell: (customer) => `$${customer.balance.toFixed(2)}`,
      },
      {
        header: "Status",
        className: "flex-1 flex justify-center",
        cell: (info) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              info.status === "Active"
                ? "bg-green-100 text-green-700 dark:bg-green-100 dark:text-green-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-100 dark:text-gray-400"
            }`}
          >
            {info.status}
          </span>
        ),
      },
      {
        header: "Actions",
        className: "flex-[2] flex items-center justify-center gap-2",
        cell: (customer) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/customers/edit/${customer.id}`);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              <Edit3 size={12} />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteCustomer(customer);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors"
            >
              <Trash size={12} />
              Delete
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="text-primary" />
          Customers
        </h1>
        <button
          onClick={() => navigate("/customers/new")}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <DataTable data={customers} columns={columns} />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteCustomer !== null}
        onClose={() => setDeleteCustomer(null)}
        onConfirm={() => {
          setIsDeleting(true);
          if (deleteCustomer) {
            deleteCustomerFromStore(deleteCustomer.id);
          }
          setTimeout(() => {
            setIsDeleting(false);
            setDeleteCustomer(null);
            setToast({
              message: "Customer deleted successfully!",
              type: "success",
            });
          }, 500);
        }}
        itemName={deleteCustomer?.name || ""}
        itemType="Customer"
        isDeleting={isDeleting}
      />

      {/* Toast Notification */}
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
