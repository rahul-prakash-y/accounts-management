import { Model } from '@nozbe/watermelondb'
import { field, relation } from '@nozbe/watermelondb/decorators'
import Order from './Order'
import Product from './Product'

export default class OrderItem extends Model {
    static table = 'order_items'

    static associations = {
        orders: { type: 'belongs_to', key: 'order_id' } as const,
        products: { type: 'belongs_to', key: 'product_id' } as const,
    }

    @field('quantity') quantity!: number
    @field('unit_price') unitPrice!: number
    @field('selling_price') sellingPrice!: number
    @field('description') description!: string | null

    @relation('orders', 'order_id') order!: Order
    @relation('products', 'product_id') product!: Product
}
