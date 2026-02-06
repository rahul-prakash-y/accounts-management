import { useMemo, useState, useRef } from "react";
import {
  Plus,
  Search,
  Edit3,
  Trash,
  Printer,
  Download,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable, ColumnDef } from "../components/DataTable";
import { DeleteConfirmationModal } from "../components/DeleteConfirmationModal";
import { DatePicker } from "../components/DatePicker";
import { Select } from "../components/Select";
import { format, subDays } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { InvoiceTemplate } from "../components/InvoiceTemplate";
import { PaymentModal } from "../components/PaymentModal";
import { Toast } from "../components/Toast";
import { useOrderStore } from "../store/orderStore";
import { useSettingsStore } from "../store/settingsStore";
import SkeletonLoader from "../components/SkeletonLoader";
import { useEffect } from "react";

// COMPANIES removed, will derive from store

export default function Orders() {
  const navigate = useNavigate();
  const {
    orders,
    totalCount,
    pageSize,
    currentPage,
    isLoading,
    error,
    fetchOrders,
    subscribeToOrders,
    unsubscribeFromOrders,
  } = useOrderStore();

  useEffect(() => {
    fetchOrders(currentPage, pageSize);
    subscribeToOrders();
    return () => unsubscribeFromOrders();
  }, [
    fetchOrders,
    subscribeToOrders,
    unsubscribeFromOrders,
    currentPage,
    pageSize,
  ]);

  const subCompanies = useSettingsStore((state) => state.subCompanies);

  const companyOptions = [
    { value: "all", label: "All Companies" },
    ...(subCompanies?.map((sc) => ({ value: sc.id, label: sc.name })) || []),
  ];

  const { updateOrder, deleteOrder: deleteOrderFromStore } = useOrderStore(); // Use real store methods

  const [filterDate, setFilterDate] = useState(() =>
    format(subDays(new Date(), 30), "yyyy-MM-dd"),
  );
  const [filterEndDate, setFilterEndDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [deleteOrder, setDeleteOrder] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [printOrder, setPrintOrder] = useState<any | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const bulkInvoiceRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
  });

  const handleBulkPrint = useReactToPrint({
    contentRef: bulkInvoiceRef,
    documentTitle: `invoices_${filterDate}_to_${filterEndDate}`,
  });

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Date Filter
      let dateMatch = true;
      try {
        const dateStr =
          order.created_at || order.date || new Date().toISOString();
        const orderDate = new Date(dateStr);
        if (!isNaN(orderDate.getTime())) {
          const orderDateStr = orderDate.toISOString().split("T")[0];
          dateMatch =
            orderDateStr >= filterDate && orderDateStr <= filterEndDate;
        }
      } catch {
        dateMatch = true;
      }

      // Company Filter
      let companyMatch = true;
      if (selectedCompany === "all") {
        companyMatch = true;
      } else if (selectedCompany === "main") {
        companyMatch = !order.subCompanyId;
      } else {
        companyMatch = order.subCompanyId === selectedCompany;
      }

      // Search Filter
      const searchMatch = order.customer_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      return dateMatch && companyMatch && searchMatch;
    });
  }, [filterDate, filterEndDate, selectedCompany, searchQuery, orders?.length]);

  // Pagination Logic removed for Virtual Scroll
  // const totalPages = Math.ceil(filteredOrders.length / 10); // temporary fixed or removed

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: "#",
        accessorKey: "id",
        className: "flex-[1] text-muted-foreground",
        cell: (info) => (
          <span title={info.id} className="font-mono">
            #{info.id.substring(0, 6).toUpperCase()}
          </span>
        ),
      },
      {
        header: "Customer",
        accessorKey: "customer_name",
        className: "flex-[3] font-medium truncate",
      },
      {
        header: "Date",
        accessorKey: "created_at",
        cell: (info) =>
          info.created_at
            ? format(new Date(info.created_at), "yyyy-MM-dd")
            : "N/A",
        className: "flex-[2] text-muted-foreground",
      },
      {
        header: "Items",
        cell: (info) => <span>{info.items?.length} items</span>,
        className: "flex-[2]",
      },
      {
        header: "Total",
        cell: (info) => (
          <span className="font-mono">${info.total.toFixed(2)}</span>
        ),
        className: "flex-[2] text-right",
      },
      {
        header: "Paid",
        cell: (info) => (
          <span className="font-mono text-green-600">
            ${(info.amountPaid || 0).toFixed(2)}
          </span>
        ),
        className: "flex-[2] text-right",
      },
      {
        header: "Balance",
        cell: (info) => (
          <span
            className={`font-mono ${info.total - (info.amountPaid || 0) > 0 ? "text-destructive" : "text-green-600"}`}
          >
            ${(info.total - (info.amountPaid || 0)).toFixed(2)}
          </span>
        ),
        className: "flex-[2] text-right",
      },
      {
        header: "Delivery Status",
        className: "flex-[2] text-center",
        cell: (info) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              info.status === "Completed"
                ? "bg-green-100 text-green-700 dark:bg-green-100 dark:text-green-400"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-100 dark:text-yellow-400"
            }`}
          >
            {info.status}
          </span>
        ),
      },
      {
        header: "Payment Status",
        className: "flex-[2] text-center",
        cell: (info) => (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
              info.paymentStatus === "Paid"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : info.paymentStatus === "Partial"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {info.paymentStatus || "Unpaid"}
          </span>
        ),
      },
      {
        header: "Actions",
        className: "flex-[4] flex items-center justify-center gap-2",
        cell: (order) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPrintOrder(order);
                setTimeout(() => handlePrint(), 100);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
              title="Print Invoice"
            >
              <Printer size={12} />
            </button>
            {order.paymentStatus !== "Paid" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPaymentOrder(order);
                  setIsPaymentModalOpen(true);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
                title="Receive Payment"
              >
                <DollarSign size={12} />
                Pay
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/edit/${order.id}`);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              <Edit3 size={12} />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteOrder(order);
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

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Orders</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkPrint}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-all"
            >
              <Download size={16} />
              Download All Invoices
            </button>
            <button
              onClick={() => navigate("/orders/new")}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <Plus size={20} />
              New Order
            </button>
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              From:
            </span>
            <DatePicker
              value={filterDate}
              onChange={(date) => {
                setFilterDate(date);
                if (date > filterEndDate) {
                  setFilterEndDate(date);
                }
              }}
              className=""
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              To:
            </span>
            <DatePicker
              value={filterEndDate}
              onChange={(date) => {
                setFilterEndDate(date);
                if (date < filterDate) {
                  setFilterDate(date);
                }
              }}
              className=""
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {filteredOrders.length} orders
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
              Company:
            </span>
            <Select
              options={companyOptions}
              value={selectedCompany}
              onChange={setSelectedCompany}
              className="w-[200px]"
            />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by customer name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-4 border border-destructive/20">
          <p className="font-semibold">Error loading orders:</p>
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <SkeletonLoader rows={10} />
      ) : (
        <DataTable
          data={filteredOrders}
          columns={columns}
          onRowClick={(order) => console.log("Clicked", order.id)}
          estimateRowHeight={80}
          isPagination={true}
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / pageSize)}
          goToPage={(page) => fetchOrders(page, pageSize)}
          height={600} // Fixed height for virtualization to work well, or flex-1 in parent
        />
      )}
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteOrder}
        onClose={() => setDeleteOrder(null)}
        onConfirm={async () => {
          setIsDeleting(true);
          if (deleteOrder) {
            deleteOrderFromStore(deleteOrder.id);
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setIsDeleting(false);
          setDeleteOrder(null);
          setToast({ message: "Order deleted successfully!", type: "success" });
        }}
        isDeleting={isDeleting}
        itemName={deleteOrder?.customer_name || ""}
        itemType="order"
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentOrder(null);
        }}
        order={paymentOrder}
        onSubmit={async (amount, mode, status) => {
          if (paymentOrder) {
            const newAmountPaid = (paymentOrder.amountPaid || 0) + amount;

            let message = `Payment of $${amount.toFixed(2)} received via ${mode}`;

            // Construct updates
            const updates: any = {
              amountPaid: newAmountPaid,
              paymentMode: mode, // Last payment mode
              paymentStatus:
                newAmountPaid >= paymentOrder.total ? "Paid" : "Partial",
            };

            if (status !== paymentOrder.status) {
              updates.status = status;
              message += ` & Delivery Status updated to ${status}`;
            }

            await updateOrder(paymentOrder.id, updates);

            setToast({
              message: message + " successfully!",
              type: "success",
            });
          }
        }}
      />

      {/* Hidden Invoice Template for Printing */}
      {printOrder && (
        <div className="hidden">
          <InvoiceTemplate
            ref={invoiceRef}
            order={{
              ...printOrder,
              date:
                printOrder.date ||
                printOrder.created_at ||
                new Date().toISOString().split("T")[0],
            }}
          />
        </div>
      )}

      {/* Hidden Bulk Invoice Templates for Printing All */}
      <div className="hidden">
        <div ref={bulkInvoiceRef}>
          {filteredOrders.map((order, index) => (
            <div
              key={order.id}
              className={index > 0 ? "page-break-before" : ""}
            >
              <InvoiceTemplate
                order={{
                  ...order,
                  date:
                    order.date ||
                    order.created_at ||
                    new Date().toISOString().split("T")[0],
                }}
              />
            </div>
          ))}
        </div>
      </div>

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
