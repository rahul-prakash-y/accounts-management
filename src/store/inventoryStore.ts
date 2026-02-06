import { create } from "zustand";
import { supabase } from "../lib/supabase";

export interface InventoryItem {
    id: string;
    sku: string;
    name: string;
    description: string;
    unit_price: number;
    stock_level: number;
    reorder_level: number;
    status: string;
    price: number;
    created_at?: string;
}

interface InventoryState {
    inventory: InventoryItem[];
    isLoading: boolean;
    error: string | null;
    fetchInventory: () => Promise<void>;
    addInventoryItem: (item: Omit<InventoryItem, 'id' | 'created_at'> & { id?: string }) => Promise<void>;
    updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
    deleteInventoryItem: (id: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>()(
    (set) => ({
        inventory: [],
        isLoading: false,
        error: null,

        fetchInventory: async () => {
            set({ isLoading: true, error: null });
            try {
                // Assuming 'products' table maps to InventoryItem
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                set({ inventory: data as InventoryItem[], isLoading: false });
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
            }
        },

        addInventoryItem: async (item) => {
            set({ isLoading: true, error: null });
            try {
                const { id, ...newItemData } = item;
                const { data, error } = await supabase
                    .from('products')
                    .insert([newItemData])
                    .select()
                    .single();

                if (error) throw error;
                set((state) => ({
                    inventory: [data as InventoryItem, ...state.inventory],
                    isLoading: false
                }));
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
                throw error;
            }
        },

        updateInventoryItem: async (id, updates) => {
            set({ isLoading: true, error: null });
            try {
                // Map frontend names to DB names and filter out UI-only fields
                const dbUpdates: any = {};

                if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
                if (updates.name !== undefined) dbUpdates.name = updates.name;
                if (updates.description !== undefined) dbUpdates.description = updates.description;
                if (updates.unit_price !== undefined) dbUpdates.unit_price = updates.unit_price;
                if (updates.price !== undefined) dbUpdates.price = updates.price;
                if (updates.stock_level !== undefined) dbUpdates.stock_level = updates.stock_level;
                if (updates.reorder_level !== undefined) dbUpdates.reorder_level = updates.reorder_level;
                if (updates.status !== undefined) dbUpdates.status = updates.status;

                if (Object.keys(dbUpdates).length === 0) {
                    set({ isLoading: false });
                    return;
                }

                const { error } = await supabase
                    .from('products')
                    .update(dbUpdates)
                    .eq('id', id);

                if (error) throw error;
                set((state) => ({
                    inventory: state.inventory.map((i) =>
                        i.id === id ? { ...i, ...updates } : i,
                    ),
                    isLoading: false
                }));
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
                throw error;
            }
        },

        deleteInventoryItem: async (id) => {
            set({ isLoading: true, error: null });
            try {
                const { error } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                set((state) => ({
                    inventory: state.inventory.filter((i) => i.id !== id),
                    isLoading: false
                }));
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
                throw error;
            }
        },
    })
);
