import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators'
import OrderItem from './OrderItem'

export default class Order extends Model {
    static table = 'orders'

    static associations = {
        order_items: { type: 'has_many', foreignKey: 'order_id' } as const,
    }

    @field('remote_id') remoteId!: string | null
    @field('customer_id') customerId!: string
    @field('total_amount') totalAmount!: number
    @field('discount') discount!: number
    @field('payment_status') paymentStatus!: string
    @field('status') status!: string
    @field('sync_status') syncStatus!: string

    @readonly @date('created_at') createdAt!: Date
    @readonly @date('updated_at') updatedAt!: Date

    @children('order_items') items!: any // Type appropriately if specific queries needed
}
