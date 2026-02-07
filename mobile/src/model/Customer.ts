import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Customer extends Model {
    static table = 'customers'

    @field('remote_id') remoteId!: string
    @field('name') name!: string
    @field('address') address!: string | null
    @field('balance') balance!: number

    @readonly @date('created_at') createdAt!: Date
    @readonly @date('updated_at') updatedAt!: Date
}
