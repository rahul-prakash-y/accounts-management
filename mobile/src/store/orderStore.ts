import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export type OrderItem = {
    itemId: string; // product_id (UUID)
    quantity: number;
    freeQty?: number;
    unitPrice: number; // MRP
    sellingPrice?: number; // Actual SP
    description: string;
};

export interface Order {
    id: string; // UUID
    customer_name: string;
    customer_address?: string;
    customer_id?: string;
    salesman_id?: string;
    salesman_name?: string; // Fetched from employees table
    salesman_no?: string; // For frontend display compatibility
    subCompanyId?: string; // sub_company_id

    date: string; // For UI display
    created_at?: string;

    total: number;
    discount?: number;

    amountPaid?: number;
    paymentStatus?: "Unpaid" | "Partial" | "Paid";
    paymentMode?: "Cash" | "UPI" | "Card" | "Net Banking";

    status: string;
    items: OrderItem[];
}

interface OrderState {
    orders: Order[];
    totalCount: number;
    pageSize: number;
    currentPage: number;
    isLoading: boolean;
    error: string | null;
    fetchOrders: (page?: number, pageSize?: number, startDate?: string, endDate?: string) => Promise<void>;
    fetchMoreOrders: (pageSize?: number) => Promise<void>;
    hasMore: boolean;
    addOrder: (order: Order) => Promise<void>;
    updateOrder: (id: string, order: Partial<Order>) => Promise<void>;
    deleteOrder: (id: string) => Promise<void>;
    allocateCustomerPayment: (customerId: string, amount: number) => Promise<void>;
    subscribeToOrders: () => void;
    unsubscribeFromOrders: () => void;
    subscription: any;
}

export const useOrderStore = create<OrderState>((set, get) => ({
    orders: [],
    totalCount: 0,
    pageSize: 20,
    currentPage: 1,
    isLoading: false,
    error: null,
    hasMore: true,
    subscription: null as any,

    fetchOrders: async (page = 1, pageSize = 20, startDate?: string, endDate?: string) => {
        set({ isLoading: true, error: null });
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from('orders')
                .select(`
                    *,
                    order_items (*),
                    employees:salesman_id (name)
                `, { count: 'exact' });

            if (startDate) {
                query = query.gte('created_at', startDate);
            }
            if (endDate) {
                query = query.lte('created_at', endDate);
            }

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            const mappedOrders: Order[] = (data || []).map((row: any) => ({
                id: row.id,
                customer_id: row.customer_id,
                customer_name: row.customer_name || "Unknown",
                customer_address: row.customer_address,
                salesman_id: row.salesman_id,
                salesman_name: row.employees?.name,
                salesman_no: row.salesman_id,
                subCompanyId: row.sub_company_id,

                total: Number(row.total_amount),
                discount: Number(row.discount || 0),
                amountPaid: Number(row.amount_paid || 0),
                paymentStatus: row.payment_status,
                paymentMode: row.payment_mode,
                status: row.status,

                created_at: row.created_at,
                date: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],

                items: (row.order_items || []).map((item: any) => ({
                    itemId: item.product_id,
                    quantity: Number(item.quantity),
                    freeQty: Number(item.free_qty || 0),
                    unitPrice: Number(item.unit_price),
                    sellingPrice: Number(item.selling_price),
                    description: item.description,
                })),
            }));

            set({
                orders: mappedOrders,
                isLoading: false,
                totalCount: count || 0,
                currentPage: page,
                pageSize,
                hasMore: mappedOrders.length === pageSize
            });
        } catch (err: any) {
            console.error("Error fetching orders:", err);
            set({ error: err.message, isLoading: false });
        }
    },

    fetchMoreOrders: async (pageSize = 20) => {
        const { orders, hasMore, isLoading, currentPage } = get();
        if (isLoading || !hasMore) return;

        set({ isLoading: true });
        try {
            const nextPage = currentPage + 1;
            const from = (nextPage - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (*),
                    employees:salesman_id (name)
                `)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            const mappedOrders: Order[] = (data || []).map((row: any) => ({
                id: row.id,
                customer_id: row.customer_id,
                customer_name: row.customer_name || "Unknown",
                customer_address: row.customer_address,
                salesman_id: row.salesman_id,
                salesman_name: row.employees?.name,
                salesman_no: row.salesman_id,
                subCompanyId: row.sub_company_id,

                total: Number(row.total_amount),
                discount: Number(row.discount || 0),
                amountPaid: Number(row.amount_paid || 0),
                paymentStatus: row.payment_status,
                paymentMode: row.payment_mode,
                status: row.status,

                created_at: row.created_at,
                date: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],

                items: (row.order_items || []).map((item: any) => ({
                    itemId: item.product_id,
                    quantity: Number(item.quantity),
                    freeQty: Number(item.free_qty || 0),
                    unitPrice: Number(item.unit_price),
                    sellingPrice: Number(item.selling_price),
                    description: item.description,
                })),
            }));

            set({
                orders: [...orders, ...mappedOrders],
                isLoading: false,
                currentPage: nextPage,
                hasMore: mappedOrders.length === pageSize
            });
        } catch (err: any) {
            console.error("Error fetching more orders:", err);
            set({ error: err.message, isLoading: false });
        }
    },

    addOrder: async (order: Order) => {
        set({ isLoading: true, error: null });
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Not authenticated");

            // 1. Insert Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    customer_name: order.customer_name,
                    customer_address: order.customer_address,
                    customer_id: order.customer_id,
                    salesman_id: order.salesman_id || order.salesman_no,
                    sub_company_id: order.subCompanyId,
                    total_amount: order.total,
                    discount: order.discount,
                    amount_paid: order.amountPaid,
                    payment_status: order.paymentStatus || 'Unpaid',
                    payment_mode: order.paymentMode,
                    status: order.status || 'Pending'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Insert Items
            const itemsToInsert = order.items.map(item => ({
                order_id: orderData.id,
                product_id: item.itemId,
                quantity: item.quantity,
                free_qty: item.freeQty || 0,
                unit_price: item.unitPrice,
                selling_price: item.sellingPrice ?? item.unitPrice,
                price: item.sellingPrice ?? item.unitPrice,
                description: item.description
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            // 3. Update Customer Balance
            if (order.customer_id) {
                const balanceChange = (order.amountPaid || 0) - order.total;
                const { error: balanceError } = await supabase.rpc('update_customer_balance', {
                    p_customer_id: order.customer_id,
                    p_amount: balanceChange
                });

                if (balanceError) {
                    const { data: customer } = await supabase
                        .from('customers')
                        .select('balance')
                        .eq('id', order.customer_id)
                        .single();

                    if (customer) {
                        await supabase
                            .from('customers')
                            .update({ balance: (customer.balance || 0) + balanceChange })
                            .eq('id', order.customer_id);
                    }
                }
            }

            get().fetchOrders(get().currentPage, get().pageSize);
        } catch (err: any) {
            console.error("Add order failed:", err);
            set({ error: err.message, isLoading: false });
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },

    updateOrder: async (id: string, updates: Partial<Order>) => {
        set({ isLoading: true, error: null });
        try {
            const dbUpdates: any = {};
            if (updates.total !== undefined) dbUpdates.total_amount = updates.total;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.amountPaid !== undefined) dbUpdates.amount_paid = updates.amountPaid;
            if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
            if (updates.paymentMode !== undefined) dbUpdates.payment_mode = updates.paymentMode;
            if (updates.customer_name !== undefined) dbUpdates.customer_name = updates.customer_name;
            if (updates.customer_address !== undefined) dbUpdates.customer_address = updates.customer_address;

            if (Object.keys(dbUpdates).length > 0) {
                let balanceChange = 0;
                let customerId = "";

                if (updates.amountPaid !== undefined) {
                    const { data: oldOrder } = await supabase
                        .from('orders')
                        .select('amount_paid, customer_id')
                        .eq('id', id)
                        .single();

                    if (oldOrder) {
                        balanceChange = updates.amountPaid - Number(oldOrder.amount_paid || 0);
                        customerId = oldOrder.customer_id;
                    }
                }

                const { error } = await supabase
                    .from('orders')
                    .update(dbUpdates)
                    .eq('id', id);

                if (error) throw error;

                if (balanceChange !== 0 && customerId) {
                    const { error: balanceError } = await supabase.rpc('update_customer_balance', {
                        p_customer_id: customerId,
                        p_amount: balanceChange
                    });

                    if (balanceError) {
                        const { data: customer } = await supabase
                            .from('customers')
                            .select('balance')
                            .eq('id', customerId)
                            .single();

                        if (customer) {
                            await supabase
                                .from('customers')
                                .update({ balance: (customer.balance || 0) + balanceChange })
                                .eq('id', customerId);
                        }
                    }
                }
            }
            get().fetchOrders(get().currentPage, get().pageSize);
        } catch (err: any) {
            console.error("Update order failed:", err);
            set({ error: err.message, isLoading: false });
        } finally {
            set({ isLoading: false });
        }
    },

    deleteOrder: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const { data: orderToDelete } = await supabase
                .from('orders')
                .select('customer_id, total_amount, amount_paid, order_items(product_id, quantity, free_qty)')
                .eq('id', id)
                .single();

            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', id);

            if (error) throw error;

            if (orderToDelete && orderToDelete.order_items) {
                for (const item of (orderToDelete.order_items as any)) {
                    const { error: stockError } = await supabase.rpc('update_product_stock', {
                        p_product_id: item.product_id,
                        p_quantity: (Number(item.quantity) + Number(item.free_qty || 0))
                    });

                    if (stockError) {
                        const { data: product } = await supabase
                            .from('products')
                            .select('stock_level')
                            .eq('id', item.product_id)
                            .single();

                        if (product) {
                            await supabase
                                .from('products')
                                .update({ stock_level: Number(product.stock_level || 0) + (Number(item.quantity) + Number(item.free_qty || 0)) })
                                .eq('id', item.product_id);
                        }
                    }
                }
            }

            if (orderToDelete && orderToDelete.customer_id) {
                const balanceRefund = Number(orderToDelete.total_amount) - Number(orderToDelete.amount_paid || 0);
                const { error: balanceError } = await supabase.rpc('update_customer_balance', {
                    p_customer_id: orderToDelete.customer_id,
                    p_amount: balanceRefund
                });

                if (balanceError) {
                    const { data: customer } = await supabase
                        .from('customers')
                        .select('balance')
                        .eq('id', orderToDelete.customer_id)
                        .single();

                    if (customer) {
                        await supabase
                            .from('customers')
                            .update({ balance: (customer.balance || 0) + balanceRefund })
                            .eq('id', orderToDelete.customer_id);
                    }
                }
            }

            set(state => ({
                orders: state.orders.filter(o => o.id !== id),
                totalCount: Math.max(0, state.totalCount - 1)
            }));
        } catch (err: any) {
            console.error("Delete order failed:", err);
            set({ error: err.message, isLoading: false });
        } finally {
            set({ isLoading: false });
        }
    },

    allocateCustomerPayment: async (customerId: string, amount: number) => {
        set({ isLoading: true, error: null });
        try {
            const { data: orders, error: fetchError } = await supabase
                .from('orders')
                .select('*')
                .eq('customer_id', customerId)
                .neq('payment_status', 'Paid')
                .order('created_at', { ascending: true });

            if (fetchError) throw fetchError;

            let remaining = amount;
            if (orders && orders.length > 0) {
                for (const order of orders) {
                    if (remaining <= 0) break;

                    const total = Number(order.total_amount);
                    const paid = Number(order.amount_paid || 0);
                    const owed = total - paid;
                    const applied = Math.min(remaining, owed);

                    const isFullyPaid = (paid + applied) >= total;
                    await get().updateOrder(order.id, {
                        amountPaid: paid + applied,
                        paymentStatus: isFullyPaid ? 'Paid' : 'Partial',
                        status: isFullyPaid ? 'Completed' : order.status
                    });

                    remaining -= applied;
                }
            }

            if (remaining > 0) {
                const { error: balanceError } = await supabase.rpc('update_customer_balance', {
                    p_customer_id: customerId,
                    p_amount: remaining
                });

                if (balanceError) {
                    const { data: customer } = await supabase
                        .from('customers')
                        .select('balance')
                        .eq('id', customerId)
                        .single();

                    if (customer) {
                        await supabase
                            .from('customers')
                            .update({ balance: Number(customer.balance || 0) + remaining })
                            .eq('id', customerId);
                    }
                }
            }
        } catch (err: any) {
            console.error("Payment allocation failed:", err);
            set({ error: err.message });
        } finally {
            set({ isLoading: false });
        }
    },

    subscribeToOrders: () => {
        const subscription = supabase
            .channel('orders-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
                const { currentPage, pageSize } = get();
                if (payload.eventType === 'INSERT') {
                    if (currentPage === 1) {
                        get().fetchOrders(1, pageSize);
                    } else {
                        set(state => ({ totalCount: state.totalCount + 1 }));
                    }
                } else if (payload.eventType === 'UPDATE') {
                    const updatedOrder = payload.new;
                    set(state => ({
                        orders: state.orders.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o)
                    }));
                } else if (payload.eventType === 'DELETE') {
                    const deletedId = payload.old.id;
                    set(state => ({
                        orders: state.orders.filter(o => o.id !== deletedId),
                        totalCount: Math.max(0, state.totalCount - 1)
                    }));
                }
            })
            .subscribe();
        set({ subscription });
    },

    unsubscribeFromOrders: () => {
        const { subscription } = get();
        if (subscription) {
            supabase.removeChannel(subscription);
            set({ subscription: null });
        }
    }
}));
