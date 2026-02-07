import { create } from "zustand";
import { supabase } from "@/lib/supabase";

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
    created_at?: string;
}

interface TransactionState {
    transactions: Transaction[];
    totalCount: number;
    pageSize: number;
    currentPage: number;
    isLoading: boolean;
    error: string | null;
    fetchTransactions: (page?: number, pageSize?: number, startDate?: string, endDate?: string) => Promise<void>;
    fetchMoreTransactions: (pageSize?: number) => Promise<void>;
    hasMore: boolean;
    addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>()(
    (set, get) => ({
        transactions: [],
        totalCount: 0,
        pageSize: 20,
        currentPage: 1,
        isLoading: false,
        error: null,
        hasMore: true,

        fetchTransactions: async (page = 1, pageSize = 20, startDate?: string, endDate?: string) => {
            set({ isLoading: true, error: null });
            try {
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;

                let query = supabase
                    .from('transactions')
                    .select('*', { count: 'exact' });

                if (startDate) {
                    query = query.gte('date', startDate);
                }
                if (endDate) {
                    query = query.lte('date', endDate);
                }

                const { data, error, count } = await query
                    .order('date', { ascending: false })
                    .range(from, to);

                if (error) throw error;
                const mappedTransactions = (data || []).map((t: any) => ({
                    ...t,
                    paymentMode: t.payment_mode
                }));
                set({
                    transactions: mappedTransactions as Transaction[],
                    isLoading: false,
                    totalCount: count || 0,
                    currentPage: page,
                    pageSize,
                    hasMore: mappedTransactions.length === pageSize
                });
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
            }
        },

        fetchMoreTransactions: async (pageSize = 20) => {
            const { transactions, hasMore, isLoading, currentPage } = get();
            if (isLoading || !hasMore) return;

            set({ isLoading: true });
            try {
                const nextPage = currentPage + 1;
                const from = (nextPage - 1) * pageSize;
                const to = from + pageSize - 1;

                const { data, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .order('date', { ascending: false })
                    .range(from, to);

                if (error) throw error;
                const mappedTransactions = (data || []).map((t: any) => ({
                    ...t,
                    paymentMode: t.payment_mode
                }));
                set({
                    transactions: [...transactions, ...mappedTransactions] as Transaction[],
                    isLoading: false,
                    currentPage: nextPage,
                    hasMore: mappedTransactions.length === pageSize
                });
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
            }
        },

        addTransaction: async (transactionData) => {
            set({ isLoading: true, error: null });
            try {
                const { paymentMode, ...rest } = transactionData;
                const { data, error } = await supabase
                    .from('transactions')
                    .insert([{
                        ...rest,
                        payment_mode: paymentMode
                    }])
                    .select()
                    .single();

                if (error) throw error;

                // Optimistically update or just re-fetch
                const currentTransactions = get().transactions;
                set({
                    transactions: [{ ...data, paymentMode: data.payment_mode }, ...currentTransactions],
                    isLoading: false
                });
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
                throw error;
            }
        },

        deleteTransaction: async (id) => {
            set({ isLoading: true, error: null });
            try {
                const { error } = await supabase
                    .from('transactions')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                const currentTransactions = get().transactions;
                set({
                    transactions: currentTransactions.filter(t => t.id !== id),
                    isLoading: false
                });
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
                throw error;
            }
        },
    })
);
