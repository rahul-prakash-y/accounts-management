import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export type PurchaseItem = {
    itemId: string;
    quantity: number;
    unitPrice: number;
    description: string;
};

export interface Purchase {
    id: string;
    supplier_name: string;
    company_name?: string;
    date: string;
    total: number;
    status: string;
    items_count: number;
    items: PurchaseItem[];
    totalAmount: number;
    supplierName: any;
    paymentStatus: any;
    paymentMode?: "Cash" | "UPI" | "Card" | "Net Banking";
    created_at?: string;
}

interface PurchaseState {
    purchases: Purchase[];
    totalCount: number;
    pageSize: number;
    currentPage: number;
    isLoading: boolean;
    hasMore: boolean;
    error: string | null;
    fetchPurchases: (
        page?: number,
        pageSize?: number,
        startDate?: string,
        endDate?: string,
    ) => Promise<void>;
    fetchMorePurchases: () => Promise<void>;
    updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<void>;
    deletePurchase: (id: string) => Promise<void>;
}

export const usePurchaseStore = create<PurchaseState>()((set, get) => ({
    purchases: [],
    totalCount: 0,
    pageSize: 20,
    currentPage: 1,
    isLoading: false,
    hasMore: true,
    error: null,

    fetchPurchases: async (
        page = 1,
        pageSize = 20,
        startDate?: string,
        endDate?: string,
    ) => {
        set({ isLoading: true, error: null });
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from("purchases")
                .select(
                    `
                        *,
                        purchase_items (*)
                    `,
                    { count: "exact" },
                );

            if (startDate) {
                query = query.gte("created_at", startDate);
            }
            if (endDate) {
                query = query.lte("created_at", endDate);
            }

            const { data, error, count } = await query
                .order("created_at", { ascending: false })
                .range(from, to);

            if (error) throw error;

            const mappedPurchases = data.map((p: any) => ({
                id: p.id,
                supplier_name: p.supplier_name,
                company_name: p.company_name,
                total: Number(p.total_amount),
                status: p.status,
                paymentMode: p.payment_mode,
                created_at: p.created_at,
                date: p.created_at
                    ? p.created_at.split("T")[0]
                    : new Date().toISOString().split("T")[0],
                items: p.purchase_items
                    ? p.purchase_items.map((item: any) => ({
                        itemId: item.product_id,
                        quantity: Number(item.quantity),
                        unitPrice: Number(item.unit_price),
                        description: item.description,
                    }))
                    : [],
                items_count: p.purchase_items ? p.purchase_items.length : 0,
                // Ensure all interface requirements are met
                totalAmount: Number(p.total_amount),
                supplierName: p.supplier_name,
                paymentStatus: p.payment_status || "Paid"
            })) as Purchase[];

            set({
                purchases: page === 1 ? mappedPurchases : [...get().purchases, ...mappedPurchases],
                isLoading: false,
                totalCount: count || 0,
                currentPage: page,
                pageSize,
                hasMore: (data || []).length === pageSize
            });
        } catch (error: any) {
            console.error("Fetch purchases failed:", error);
            set({ error: error.message, isLoading: false });
        }
    },

    fetchMorePurchases: async () => {
        const { currentPage, pageSize, hasMore, isLoading, fetchPurchases } = get();
        if (!hasMore || isLoading) return;
        await fetchPurchases(currentPage + 1, pageSize);
    },

    addPurchase: async (purchase: Omit<Purchase, "id" | "created_at"> & { id?: string }) => {
        set({ isLoading: true, error: null });
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Not authenticated");

            const purchaseDate = purchase.date
                ? new Date(purchase.date).toISOString()
                : new Date().toISOString();

            const { data: purchaseData, error: purchaseError } = await supabase
                .from("purchases")
                .insert({
                    user_id: user.id,
                    supplier_name: purchase.supplier_name,
                    company_name: purchase.company_name,
                    total_amount: purchase.total,
                    payment_status: "Paid",
                    payment_mode: purchase.paymentMode,
                    status: "Received",
                    created_at: purchaseDate,
                })
                .select()
                .single();

            if (purchaseError) throw purchaseError;

            if (purchase.items && purchase.items.length > 0) {
                const itemsToInsert = purchase.items.map((item: PurchaseItem) => ({
                    purchase_id: purchaseData.id,
                    product_id: item.itemId,
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                    description: item.description,
                }));

                const { error: itemsError } = await supabase
                    .from("purchase_items")
                    .insert(itemsToInsert);

                if (itemsError) throw itemsError;
            }

            get().fetchPurchases(get().currentPage, get().pageSize);
            return purchaseData.id;
        } catch (error: any) {
            console.error("Add purchase failed:", error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updatePurchase: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            const dbUpdates: any = {};

            if (updates.supplier_name !== undefined)
                dbUpdates.supplier_name = updates.supplier_name;
            if (updates.company_name !== undefined)
                dbUpdates.company_name = updates.company_name;
            if (updates.total !== undefined)
                dbUpdates.total_amount = updates.total;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.paymentMode !== undefined)
                dbUpdates.payment_mode = updates.paymentMode;
            if (updates.paymentStatus !== undefined)
                dbUpdates.payment_status = updates.paymentStatus;

            if (updates.date !== undefined) {
                dbUpdates.created_at = new Date(updates.date).toISOString();
            }

            if (Object.keys(dbUpdates).length === 0) {
                set({ isLoading: false });
                return;
            }

            const { error } = await supabase
                .from("purchases")
                .update(dbUpdates)
                .eq("id", id);

            if (error) throw error;

            set((state) => ({
                purchases: state.purchases.map((p) =>
                    p.id === id ? { ...p, ...updates } : p,
                ),
                isLoading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    deletePurchase: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from("purchases")
                .delete()
                .eq("id", id);

            if (error) throw error;
            set((state) => ({
                purchases: state.purchases.filter((p) => p.id !== id),
                totalCount: Math.max(0, state.totalCount - 1),
                isLoading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },
}));
