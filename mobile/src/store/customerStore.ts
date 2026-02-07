import { create } from "zustand";
import { supabase } from "@/lib/supabase";

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
    fetchCustomers: (limit?: number, offset?: number) => Promise<void>;
    fetchMoreCustomers: (limit?: number) => Promise<void>;
    hasMore: boolean;
    addCustomer: (customer: Omit<Customer, 'id' | 'created_at'> & { id?: string }) => Promise<void>;
    updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
}

export const useCustomerStore = create<CustomerState>()(
    (set, get) => ({
        customers: [],
        isLoading: false,
        error: null,
        hasMore: true,

        fetchCustomers: async (limit = 20, offset = 0) => {
            set({ isLoading: true, error: null });
            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .range(offset, offset + limit - 1);

                if (error) throw error;

                set({
                    customers: data as Customer[],
                    isLoading: false,
                    hasMore: (data?.length || 0) === limit
                });
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
            }
        },

        fetchMoreCustomers: async (limit = 20) => {
            const { customers, hasMore, isLoading } = get();
            if (isLoading || !hasMore) return;

            set({ isLoading: true });
            try {
                const offset = customers.length;
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .range(offset, offset + limit - 1);

                if (error) throw error;

                set({
                    customers: [...customers, ...(data as Customer[])],
                    isLoading: false,
                    hasMore: (data?.length || 0) === limit
                });
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
            }
        },

        addCustomer: async (customer) => {
            set({ isLoading: true, error: null });
            try {
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
