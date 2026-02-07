import { create } from "zustand";
import { supabase } from "@/lib/supabase";

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
    fetchInventory: (limit?: number, offset?: number) => Promise<void>;
    fetchMoreInventory: (limit?: number) => Promise<void>;
    hasMore: boolean;
    addInventoryItem: (item: Omit<InventoryItem, 'id' | 'created_at'> & { id?: string }) => Promise<void>;
    updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
    deleteInventoryItem: (id: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>()(
    (set, get) => ({
        inventory: [],
        isLoading: false,
        error: null,
        hasMore: true,

        fetchInventory: async (limit = 20, offset = 0) => {
            set({ isLoading: true, error: null });
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .range(offset, offset + limit - 1);

                if (error) throw error;

                const mappedData: InventoryItem[] = (data || []).map((item: any) => ({
                    id: item.id,
                    sku: item.sku,
                    name: item.name,
                    description: item.description,
                    unit_price: Number(item.unit_price),
                    stock_level: Number(item.stock_level),
                    reorder_level: Number(item.reorder_level),
                    status: item.status,
                    price: Number(item.price),
                    created_at: item.created_at,
                }));

                set({
                    inventory: mappedData,
                    isLoading: false,
                    hasMore: mappedData.length === limit
                });
            } catch (error: any) {
                set({ error: error.message, isLoading: false });
            }
        },

        fetchMoreInventory: async (limit = 20) => {
            const { inventory, hasMore, isLoading } = get();
            if (isLoading || !hasMore) return;

            set({ isLoading: true });
            try {
                const offset = inventory.length;
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .range(offset, offset + limit - 1);

                if (error) throw error;

                const mappedData: InventoryItem[] = (data || []).map((item: any) => ({
                    id: item.id,
                    sku: item.sku,
                    name: item.name,
                    description: item.description,
                    unit_price: Number(item.unit_price),
                    stock_level: Number(item.stock_level),
                    reorder_level: Number(item.reorder_level),
                    status: item.status,
                    price: Number(item.price),
                    created_at: item.created_at,
                }));

                set({
                    inventory: [...inventory, ...mappedData],
                    isLoading: false,
                    hasMore: mappedData.length === limit
                });
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

                const newItem: InventoryItem = {
                    id: data.id,
                    sku: data.sku,
                    name: data.name,
                    description: data.description,
                    unit_price: Number(data.unit_price),
                    stock_level: Number(data.stock_level),
                    reorder_level: Number(data.reorder_level),
                    status: data.status,
                    price: Number(data.price),
                    created_at: data.created_at,
                };

                set((state) => ({
                    inventory: [newItem, ...state.inventory],
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
