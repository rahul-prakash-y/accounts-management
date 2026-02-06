import { create } from "zustand";
import { supabase } from "../lib/supabase";

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    balance: number;
    address: string;
    status: string;
    created_at?: string;
}

interface CustomerState {
    customers: Customer[];
    isLoading: boolean;
    error: string | null;
    fetchCustomers: () => Promise<void>;
    addCustomer: (customer: Omit<Customer, 'id' | 'created_at'> & { id?: string }) => Promise<void>;
    updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
}

export const generateCustomers = (count: number): Customer[] => {
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

export const useCustomerStore = create<CustomerState>()(
    (set) => ({
        customers: [],
        isLoading: false,
        error: null,

        fetchCustomers: async () => {
            set({ isLoading: true, error: null });
            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                set({ customers: data as Customer[], isLoading: false });
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
            }
        },

        addCustomer: async (customer) => {
            set({ isLoading: true, error: null });
            try {
                // Remove id if it's a placeholder or let Supabase generate it
                const { id, ...newCustomerData } = customer;

                const { data, error } = await supabase
                    .from('customers')
                    .insert([newCustomerData])
                    .select()
                    .single();

                if (error) throw error;

                set((state) => ({
                    customers: [data as Customer, ...state.customers],
                    isLoading: false
                }));
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
                throw error;
            }
        },

        updateCustomer: async (id, updates) => {
            set({ isLoading: true, error: null });
            try {
                const { error } = await supabase
                    .from('customers')
                    .update(updates)
                    .eq('id', id);

                if (error) throw error;

                set((state) => ({
                    customers: state.customers.map((c) =>
                        c.id === id ? { ...c, ...updates } : c,
                    ),
                    isLoading: false
                }));
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
                throw error;
            }
        },

        deleteCustomer: async (id) => {
            set({ isLoading: true, error: null });
            try {
                const { error } = await supabase
                    .from('customers')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                set((state) => ({
                    customers: state.customers.filter((c) => c.id !== id),
                    isLoading: false
                }));
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
                throw error;
            }
        },
    })
);
