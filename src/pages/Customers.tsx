import { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit3,
  Trash,
  Users,
  Mail,
  Phone,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable, ColumnDef } from "../components/DataTable";
import { DeleteConfirmationModal } from "../components/DeleteConfirmationModal";
import { CustomerPaymentModal } from "../components/CustomerPaymentModal";
import { Toast } from "../components/Toast";
import { useCustomerStore } from "../store/customerStore";
import { useOrderStore } from "../store/orderStore";
import { useTransactionStore } from "../store/transactionStore";

export default function Customers() {
  const navigate = useNavigate();
  const {
    customers,
    fetchCustomers,
    deleteCustomer: deleteCustomerStore,
  } = useCustomerStore();

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const [deleteCustomer, setDeleteCustomer] = useState<
    (typeof customers)[0] | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<
    (typeof customers)[0] | null
  >(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const addTransaction = useTransactionStore((s) => s.addTransaction);

  const columns = useMemo<ColumnDef<(typeof customers)[0]>[]>(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        className: "flex-1 font-mono text-muted-foreground",
        cell: (info) => (
          <span title={info.id} className="text-xs">
            {info.id.substring(0, 8)}...
          </span>
        ),
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
        className: "flex-[2] font-mono text-center",
        cell: (customer) => (
          <span
            className={
              customer.balance < 0
                ? "text-destructive font-bold"
                : "text-green-600 font-bold"
            }
          >
            {customer.balance < 0
              ? `-$${Math.abs(customer.balance).toFixed(2)}`
              : `$${customer.balance.toFixed(2)}`}
          </span>
        ),
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
                setPaymentCustomer(customer);
                setIsPaymentModalOpen(true);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
              title="Receive Payment"
            >
              <DollarSign size={12} />
              Pay
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteCustomer(customer);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors"
            >
              <Trash size={12} />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery),
    );
  }, [customers, searchQuery]);

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <DataTable data={filteredCustomers} columns={columns} />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteCustomer !== null}
        onClose={() => setDeleteCustomer(null)}
        onConfirm={() => {
          setIsDeleting(true);
          if (deleteCustomer) {
            deleteCustomerStore(deleteCustomer.id);
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

      <CustomerPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentCustomer(null);
        }}
        customer={paymentCustomer}
        onSubmit={async (amount, mode, description) => {
          if (paymentCustomer) {
            try {
              // Use the smart allocation logic which applies payment to orders FIFO
              // and records the customer balance change automatically.
              const { allocateCustomerPayment } = useOrderStore.getState();
              await allocateCustomerPayment(paymentCustomer.id, amount);

              // 2. Record Transaction
              await addTransaction({
                type: "order",
                date: new Date().toISOString().split("T")[0],
                description: `${description} - ${paymentCustomer.name}`,
                amount: amount,
                paymentMode: mode,
              });

              setToast({
                message: `Payment of $${amount.toFixed(2)} received and allocated successfully!`,
                type: "success",
              });

              // 3. Refresh List
              fetchCustomers();
            } catch (error: any) {
              setToast({
                message: error.message || "Failed to process payment",
                type: "error",
              });
              throw error;
            }
          }
        }}
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
