import { Platform } from 'react-native'
import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import { schema } from './schema'
import migrations from './migrations'
import Product from './Product'
import Customer from './Customer'
import Order from './Order'
import OrderItem from './OrderItem'

// First, create the adapter to the underlying database:
const adapter = new SQLiteAdapter({
    schema,
    // (You might want to comment out migrations for now if you are in development and changing schema often)
    migrations,
    // (optional database name or file system path)
    // dbName: 'myapp',
    // (recommended option, should work flawlessly out of the box on iOS. On Android,
    // additional installation steps have to be taken - disable if you run into issues...)
    jsi: Platform.OS === 'ios',

    onSetUpError: error => {
        // Database failed to load -- offer the user to reload the app or log out
        console.error("Database setup failed", error)
    }
})

// Then, make a Watermelon database from it!
export const database = new Database({
    adapter,
    modelClasses: [
        Product,
        Customer,
        Order,
        OrderItem,
    ],
})
