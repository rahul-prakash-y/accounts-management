import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Product extends Model {
    static table = 'products'

    @field('remote_id') remoteId!: string
    @field('name') name!: string
    @field('mrp') mrp!: number
    @field('selling_price') sellingPrice!: number
    @field('stock_level') stockLevel!: number

    @readonly @date('created_at') createdAt!: Date
    @readonly @date('updated_at') updatedAt!: Date
}
