-- ============================================================================
-- MIGRATION SCRIPT: v1 to v2 (Incremental Update)
-- This script safely migrates from schema_v1 to schema_v2
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CREATE NEW TABLES (that don't exist in v1)
-- ============================================================================

-- Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    balance NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT,
    department TEXT,
    location TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products/Inventory Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    price NUMERIC NOT NULL DEFAULT 0,
    stock_level NUMERIC NOT NULL DEFAULT 0,
    reorder_level NUMERIC DEFAULT 10,
    status TEXT DEFAULT 'In Stock' CHECK (status IN ('In Stock', 'Low Stock', 'Out of Stock')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company Settings Table
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    gst_no TEXT,
    is_main BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sub Companies Table
CREATE TABLE IF NOT EXISTS public.sub_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    gst_no TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions/Expenses Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    category TEXT,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_mode TEXT CHECK (payment_mode IN ('Cash', 'UPI', 'Card', 'Net Banking')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. ALTER EXISTING TABLES (add missing columns)
-- ============================================================================

-- Add columns to orders table
DO $$ 
BEGIN
    -- Add customer_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_id') THEN
        ALTER TABLE public.orders ADD COLUMN customer_id UUID REFERENCES public.customers(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_name') THEN
        ALTER TABLE public.orders ADD COLUMN customer_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_address') THEN
        ALTER TABLE public.orders ADD COLUMN customer_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='salesman_id') THEN
        ALTER TABLE public.orders ADD COLUMN salesman_id UUID REFERENCES public.employees(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='sub_company_id') THEN
        ALTER TABLE public.orders ADD COLUMN sub_company_id UUID REFERENCES public.sub_companies(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='discount') THEN
        ALTER TABLE public.orders ADD COLUMN discount NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='amount_paid') THEN
        ALTER TABLE public.orders ADD COLUMN amount_paid NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_status') THEN
        ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_mode') THEN
        ALTER TABLE public.orders ADD COLUMN payment_mode TEXT CHECK (payment_mode IN ('Cash', 'UPI', 'Card', 'Net Banking'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='status') THEN
        ALTER TABLE public.orders ADD COLUMN status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Cancelled'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='updated_at') THEN
        ALTER TABLE public.orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Rename total_amount to match frontend expectation (if needed)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='total_amount') THEN
        -- Keep total_amount, frontend will map it
        NULL;
    END IF;
END $$;

-- Add columns to order_items table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='description') THEN
        ALTER TABLE public.order_items ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='free_qty') THEN
        ALTER TABLE public.order_items ADD COLUMN free_qty NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='unit_price') THEN
        ALTER TABLE public.order_items ADD COLUMN unit_price NUMERIC NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='selling_price') THEN
        ALTER TABLE public.order_items ADD COLUMN selling_price NUMERIC NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Add columns to purchases table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='supplier_name') THEN
        ALTER TABLE public.purchases ADD COLUMN supplier_name TEXT NOT NULL DEFAULT 'Unknown';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='company_name') THEN
        ALTER TABLE public.purchases ADD COLUMN company_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='payment_status') THEN
        ALTER TABLE public.purchases ADD COLUMN payment_status TEXT DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='payment_mode') THEN
        ALTER TABLE public.purchases ADD COLUMN payment_mode TEXT CHECK (payment_mode IN ('Cash', 'UPI', 'Card', 'Net Banking'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='status') THEN
        ALTER TABLE public.purchases ADD COLUMN status TEXT DEFAULT 'Ordered' CHECK (status IN ('Ordered', 'Received', 'Cancelled'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='updated_at') THEN
        ALTER TABLE public.purchases ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add columns to purchase_items table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_items' AND column_name='description') THEN
        ALTER TABLE public.purchase_items ADD COLUMN description TEXT;
    END IF;
    
    -- Rename cost to unit_price for consistency
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_items' AND column_name='cost') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_items' AND column_name='unit_price') THEN
        ALTER TABLE public.purchase_items RENAME COLUMN cost TO unit_price;
    END IF;
END $$;

-- Update stock_levels to reference products
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_levels' AND column_name='updated_at') THEN
        ALTER TABLE public.stock_levels ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ============================================================================
-- 3. UPDATE TRIGGERS & FUNCTIONS
-- ============================================================================

-- Drop old trigger function if exists
DROP FUNCTION IF EXISTS update_inventory() CASCADE;

-- Function to update product stock levels
CREATE OR REPLACE FUNCTION update_product_stock() RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'order_items' THEN
        -- Decrease stock for orders
        UPDATE public.products
        SET stock_level = stock_level - NEW.quantity,
            status = CASE
                WHEN stock_level - NEW.quantity <= 0 THEN 'Out of Stock'
                WHEN stock_level - NEW.quantity < reorder_level THEN 'Low Stock'
                ELSE 'In Stock'
            END,
            updated_at = NOW()
        WHERE id = NEW.product_id;
        
        -- Also update stock_levels table for backward compatibility
        INSERT INTO public.stock_levels (product_id, quantity)
        VALUES (NEW.product_id, -NEW.quantity)
        ON CONFLICT (product_id) DO UPDATE
        SET quantity = stock_levels.quantity - EXCLUDED.quantity,
            updated_at = NOW();
            
    ELSIF TG_TABLE_NAME = 'purchase_items' THEN
        -- Increase stock for purchases
        UPDATE public.products
        SET stock_level = stock_level + NEW.quantity,
            status = CASE
                WHEN stock_level + NEW.quantity <= 0 THEN 'Out of Stock'
                WHEN stock_level + NEW.quantity < reorder_level THEN 'Low Stock'
                ELSE 'In Stock'
            END,
            updated_at = NOW()
        WHERE id = NEW.product_id;
        
        -- Also update stock_levels table for backward compatibility
        INSERT INTO public.stock_levels (product_id, quantity)
        VALUES (NEW.product_id, NEW.quantity)
        ON CONFLICT (product_id) DO UPDATE
        SET quantity = stock_levels.quantity + EXCLUDED.quantity,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for inventory management
DROP TRIGGER IF EXISTS tr_order_items_stock ON public.order_items;
CREATE TRIGGER tr_order_items_stock
AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION update_product_stock();

DROP TRIGGER IF EXISTS tr_purchase_items_stock ON public.purchase_items;
CREATE TRIGGER tr_purchase_items_stock
AFTER INSERT ON public.purchase_items
FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS tr_customers_updated_at ON public.customers;
CREATE TRIGGER tr_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_employees_updated_at ON public.employees;
CREATE TRIGGER tr_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_products_updated_at ON public.products;
CREATE TRIGGER tr_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_orders_updated_at ON public.orders;
CREATE TRIGGER tr_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_purchases_updated_at ON public.purchases;
CREATE TRIGGER tr_purchases_updated_at
BEFORE UPDATE ON public.purchases
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (from v1) to avoid conflicts
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.purchases;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.purchase_items;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.stock_levels;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.system_logs;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.system_logs;

-- Create policies for all tables
CREATE POLICY "Enable all for authenticated users" ON public.customers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON public.employees
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON public.products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON public.company_settings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON public.sub_companies
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON public.orders
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON public.order_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON public.purchases
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON public.purchase_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON public.transactions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON public.stock_levels
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users" ON public.system_logs
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" ON public.system_logs
    FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON public.purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON public.purchase_items(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
