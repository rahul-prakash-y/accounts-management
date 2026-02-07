import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
    version: 1,
    tables: [
        tableSchema({
            name: 'products',
            columns: [
                { name: 'remote_id', type: 'string', isIndexed: true },
                { name: 'name', type: 'string' },
                { name: 'mrp', type: 'number' },
                { name: 'selling_price', type: 'number' },
                { name: 'stock_level', type: 'number' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ]
        }),
        tableSchema({
            name: 'customers',
            columns: [
                { name: 'remote_id', type: 'string', isIndexed: true },
                { name: 'name', type: 'string' },
                { name: 'address', type: 'string', isOptional: true },
                { name: 'balance', type: 'number' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ]
        }),
        tableSchema({
            name: 'orders',
            columns: [
                { name: 'remote_id', type: 'string', isOptional: true, isIndexed: true },
                { name: 'customer_id', type: 'string', isIndexed: true },
                { name: 'total_amount', type: 'number' },
                { name: 'discount', type: 'number', isOptional: true },
                { name: 'payment_status', type: 'string' }, // Paid, Partial, Unpaid
                { name: 'status', type: 'string' }, // Completed, Pending
                { name: 'sync_status', type: 'string' }, // synced, pending, error
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ]
        }),
        tableSchema({
            name: 'order_items',
            columns: [
                { name: 'order_id', type: 'string', isIndexed: true },
                { name: 'product_id', type: 'string', isIndexed: true },
                { name: 'quantity', type: 'number' },
                { name: 'unit_price', type: 'number' },
                { name: 'selling_price', type: 'number' },
                { name: 'description', type: 'string', isOptional: true },
            ]
        }),
    ]
})
