import { create } from "zustand";
import { format, subDays } from "date-fns";
import { persist } from "zustand/middleware";
import { OrderItem } from "../pages/OrderForm";

// ============= Type Definitions =============
export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    balance: number;
    address: string
    status: string;
}

export interface Employee {
    id: string;
    name: string;
    role: string;
    department: string;
    location: string;
    status: string;
}

export interface InventoryItem {
    id: number;
    sku: string;
    name: string;
    description: string;
    unit_price: number;
    stock_level: number;
    reorder_level: number;
    status: string;
    price: number;
}

export interface Order {
    id: number;
    customer_name: string;
    customer_address: string;
    salesman_no: string;
    date: string;
    items: OrderItem[];
    discount: number;
    total: number;
    status: string;
    amountPaid: number;
    paymentStatus: "Unpaid" | "Partial" | "Paid";
}

export interface Purchase {
    id: number;
    supplier_name: string;
    date: string;
    total: number;
    status: string;
    items_count: number;
}

export type TransactionType = "order" | "purchase" | "expense";

export interface Transaction {
    id: string;
    type: TransactionType;
    date: string;
    description: string;
    amount: number;
    category?: string;
    customer?: string;
    supplier?: string;
    paymentMode?: "Cash" | "UPI" | "Card" | "Net Banking";
}

// ============= Settings =============
export interface CompanySettings {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    website: string;
}

// ============= Data Generators =============
const generateCustomers = (count: number): Customer[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: `CUST-${1000 + i}`,
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`,
        phone: `+1 555-01${i.toString().padStart(2, "0")}`,
        balance: Math.random() > 0.7 ? Math.random() * 1000 : 0,
        status: Math.random() > 0.9 ? "Inactive" : "Active",
        address: '',
    }));
};

const generateEmployees = (count: number): Employee[] => {
    const roles = ["Sales", "Warehouse", "Accountant", "Manager"];
    const depts = ["Sales Dept", "Storage", "Finance", "Admin"];

    return Array.from({ length: count }, (_, i) => ({
        id: `EMP-${100 + i}`,
        name: `Employee ${i + 1}`,
        role: roles[i % roles.length],
        department: depts[i % depts.length],
        location: "Main Branch",
        status: Math.random() > 0.5 ? "Active" : "Inactive",
    }));
};

const generateItems = (count: number): InventoryItem[] => {
    return Array.from({ length: count }, (_, i) => {
        const stock = Math.floor(Math.random() * 50);
        const reorderLevel = 10;
        return {
            id: i + 1,
            sku: `SKU-${1000 + i}`,
            name: `Product Item ${i + 1}`,
            description: `Description for item ${i + 1}`,
            unit_price: (Math.random() * 100),
            price: Math.random() * 100,
            stock_level: stock,
            reorder_level: reorderLevel,
            status:
                stock === 0
                    ? "Out of Stock"
                    : stock < reorderLevel
                        ? "Low Stock"
                        : "In Stock",
        };
    });
};

const generateOrders = (count: number): Order[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        customer_name: `Customer ${i + 1}`,
        date: new Date(
            Date.now() - Math.random() * 10000000000,
        ).toLocaleDateString(),
        total: (Math.random() * 1000),
        status: Math.random() > 0.5 ? "Completed" : "Pending",
        items: [],
        discount: 0,
        customer_address: "",
        salesman_no: "",
        amountPaid: 0,
        paymentStatus: "Unpaid"
    }));
};

const generatePurchases = (count: number): Purchase[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        supplier_name: `Supplier ${i + 1}`,
        date: new Date(
            Date.now() - Math.random() * 10000000000,
        ).toLocaleDateString(),
        total: (Math.random() * 5000),
        status: Math.random() > 0.5 ? "Received" : "Ordered",
        items_count: Math.floor(Math.random() * 50) + 1,
    }));
};

const generateTransactions = (): Transaction[] => {
    const orders: Transaction[] = Array.from({ length: 15 }, (_, i) => ({
        id: `ORD-${1001 + i}`,
        type: "order" as TransactionType,
        date: format(
            subDays(new Date(), Math.floor(Math.random() * 30)),
            "yyyy-MM-dd",
        ),
        description: `Order from Customer ${i + 1}`,
        amount: Math.floor(Math.random() * 5000) + 500,
        customer: `Customer ${i + 1}`,
    }));

    const purchases: Transaction[] = Array.from({ length: 12 }, (_, i) => ({
        id: `PUR-${2001 + i}`,
        type: "purchase" as TransactionType,
        date: format(
            subDays(new Date(), Math.floor(Math.random() * 30)),
            "yyyy-MM-dd",
        ),
        description: `Purchase from Supplier ${i + 1}`,
        amount: Math.floor(Math.random() * 3000) + 300,
        supplier: `Supplier ${i + 1}`,
    }));

    const expenses: Transaction[] = Array.from({ length: 10 }, (_, i) => ({
        id: `EXP-${3001 + i}`,
        type: "expense" as TransactionType,
        date: format(
            subDays(new Date(), Math.floor(Math.random() * 30)),
            "yyyy-MM-dd",
        ),
        description: [
            "Rent",
            "Utilities",
            "Salaries",
            "Marketing",
            "Office Supplies",
        ][i % 5],
        amount: Math.floor(Math.random() * 2000) + 200,
        category: ["Rent", "Utilities", "Salaries", "Marketing", "Office Supplies"][
            i % 5
        ],
    }));

    return [...orders, ...purchases, ...expenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
};

// ============= Store Definition =============
interface DataState {
    customers: Customer[];
    employees: Employee[];
    inventory: InventoryItem[];
    orders: Order[];
    purchases: Purchase[];
    transactions: Transaction[];
    companySettings: CompanySettings;

    // Customer actions
    addCustomer: (customer: Customer) => void;
    updateCustomer: (id: string, customer: Partial<Customer>) => void;
    deleteCustomer: (id: string) => void;

    // Employee actions
    addEmployee: (employee: Employee) => void;
    updateEmployee: (id: string, employee: Partial<Employee>) => void;
    deleteEmployee: (id: string) => void;

    // Inventory actions
    addInventoryItem: (item: InventoryItem) => void;
    updateInventoryItem: (id: number, item: Partial<InventoryItem>) => void;
    deleteInventoryItem: (id: number) => void;

    // Order actions
    addOrder: (order: Order) => void;
    updateOrder: (id: number, order: Partial<Order>) => void;
    deleteOrder: (id: number) => void;
    updateOrderPayment: (id: number, amount: number, mode: "Cash" | "UPI" | "Card" | "Net Banking") => void;

    // Purchase actions
    addPurchase: (purchase: Purchase) => void;
    updatePurchase: (id: number, purchase: Partial<Purchase>) => void;
    deletePurchase: (id: number) => void;

    // Transaction actions
    addTransaction: (transaction: Transaction) => void;
    deleteTransaction: (id: string) => void;

    // Settings actions
    updateCompanySettings: (settings: CompanySettings) => void;
}

export const useDataStore = create<DataState>()(persist(
    (set) => ({
        // Initial state
        customers: [],
        employees: [],
        inventory: [],
        orders: [],
        purchases: [],

        transactions: [],
        companySettings: {
            name: "Your Company Name",
            address: "123 Business Street",
            city: "City, State 12345",
            phone: "(123) 456-7890",
            email: "support@yourcompany.com",
            website: "www.yourcompany.com",
        },

        // Customer actions
        addCustomer: (customer) =>
            set((state) => ({ customers: [...state.customers, customer] })),
        updateCustomer: (id, updates) =>
            set((state) => ({
                customers: state.customers.map((c) =>
                    c.id === id ? { ...c, ...updates } : c,
                ),
            })),
        deleteCustomer: (id) =>
            set((state) => ({
                customers: state.customers.filter((c) => c.id !== id),
            })),

        // Employee actions
        addEmployee: (employee) =>
            set((state) => ({ employees: [...state.employees, employee] })),
        updateEmployee: (id, updates) =>
            set((state) => ({
                employees: state.employees.map((e) =>
                    e.id === id ? { ...e, ...updates } : e,
                ),
            })),
        deleteEmployee: (id) =>
            set((state) => ({
                employees: state.employees.filter((e) => e.id !== id),
            })),

        // Inventory actions
        addInventoryItem: (item) =>
            set((state) => ({ inventory: [...state.inventory, item] })),
        updateInventoryItem: (id, updates) =>
            set((state) => ({
                inventory: state.inventory.map((i) =>
                    i.id === id ? { ...i, ...updates } : i,
                ),
            })),
        deleteInventoryItem: (id) =>
            set((state) => ({
                inventory: state.inventory.filter((i) => i.id !== id),
            })),

        // Order actions
        addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
        updateOrder: (id, updates) =>
            set((state) => ({
                orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
            })),
        deleteOrder: (id) =>
            set((state) => ({
                orders: state.orders.filter((o) => o.id !== id),
            })),
        updateOrderPayment: (id, amount, mode) =>
            set((state) => {
                const orderIndex = state.orders.findIndex((o) => o.id === id);
                if (orderIndex === -1) return state;

                const order = state.orders[orderIndex];
                const newAmountPaid = (order.amountPaid || 0) + amount;
                let newPaymentStatus: "Unpaid" | "Partial" | "Paid" = "Unpaid";

                if (newAmountPaid >= order.total) {
                    newPaymentStatus = "Paid";
                } else if (newAmountPaid > 0) {
                    newPaymentStatus = "Partial";
                }

                const updatedOrder = {
                    ...order,
                    amountPaid: newAmountPaid,
                    paymentStatus: newPaymentStatus,
                };

                const updatedOrders = [...state.orders];
                updatedOrders[orderIndex] = updatedOrder;

                // Also create a transaction for this payment
                const transaction: Transaction = {
                    id: `TRX-${Date.now()}`,
                    type: "order",
                    date: new Date().toISOString().split('T')[0],
                    description: `Payment for Order #${order.id}`,
                    amount: amount,
                    customer: order.customer_name,
                    paymentMode: mode,
                };

                return {
                    orders: updatedOrders,
                    transactions: [transaction, ...state.transactions]
                };
            }),

        // Purchase actions
        addPurchase: (purchase) =>
            set((state) => ({ purchases: [...state.purchases, purchase] })),
        updatePurchase: (id, updates) =>
            set((state) => ({
                purchases: state.purchases.map((p) =>
                    p.id === id ? { ...p, ...updates } : p,
                ),
            })),
        deletePurchase: (id) =>
            set((state) => ({
                purchases: state.purchases.filter((p) => p.id !== id),
            })),

        // Transaction actions
        addTransaction: (transaction) =>
            set((state) => ({ transactions: [...state.transactions, transaction] })),
        deleteTransaction: (id) =>
            set((state) => ({
                transactions: state.transactions.filter((t) => t.id !== id),
            })),

        // Settings actions
        updateCompanySettings: (settings) =>
            set(() => ({ companySettings: settings })),
    }),
    {
        name: "data-store",
    }
));
