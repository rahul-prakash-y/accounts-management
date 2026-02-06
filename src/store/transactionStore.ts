import { create } from "zustand";
import { supabase } from "../lib/supabase";

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
                const mappedTransactions = data.map((t: any) => ({
                    ...t,
                    paymentMode: t.payment_mode
                }));
                set({
                    transactions: mappedTransactions as Transaction[],
                    isLoading: false,
                    totalCount: count || 0,
                    currentPage: page,
                    pageSize
                });
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
            }
        },

        addTransaction: async (transaction) => {
            set({ isLoading: true, error: null });
            try {
                const dbPayload = {
                    type: transaction.type,
                    date: transaction.date,
                    description: transaction.description,
                    amount: transaction.amount,
                    category: transaction.category,
                    payment_mode: transaction.paymentMode
                };

                const { error } = await supabase
                    .from('transactions')
                    .insert([dbPayload])
                    .select()
                    .single();

                if (error) throw error;

                get().fetchTransactions(get().currentPage, get().pageSize);
            } catch (error: any) {
                console.error("Add transaction failed:", error);
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
                set((state) => ({
                    transactions: state.transactions.filter((t) => t.id !== id),
                    totalCount: Math.max(0, state.totalCount - 1),
                    isLoading: false
                }));
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
                throw error;
            }
        },
    })
);
