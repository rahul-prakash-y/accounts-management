-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    total_amount BIGINT NOT NULL DEFAULT 0, -- Stored in cents/smallest unit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL, -- Assumes a products table exists or external ref
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    price BIGINT NOT NULL, -- Unit price in cents
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    total_amount BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    cost BIGINT NOT NULL, -- Unit cost in cents
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_levels (
    product_id UUID PRIMARY KEY,
    quantity NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inventory Triggers

-- Function to handle inventory updates
CREATE OR REPLACE FUNCTION update_inventory() RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'order_items' THEN
        -- Decrease stock for orders
        INSERT INTO public.stock_levels (product_id, quantity)
        VALUES (NEW.product_id, -NEW.quantity)
        ON CONFLICT (product_id) DO UPDATE
        SET quantity = stock_levels.quantity - EXCLUDED.quantity;
    ELSIF TG_TABLE_NAME = 'purchase_items' THEN
        -- Increase stock for purchases
        INSERT INTO public.stock_levels (product_id, quantity)
        VALUES (NEW.product_id, NEW.quantity)
        ON CONFLICT (product_id) DO UPDATE
        SET quantity = stock_levels.quantity + EXCLUDED.quantity;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
DROP TRIGGER IF EXISTS tr_order_items_inventory ON public.order_items;
CREATE TRIGGER tr_order_items_inventory
AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION update_inventory();

DROP TRIGGER IF EXISTS tr_purchase_items_inventory ON public.purchase_items;
CREATE TRIGGER tr_purchase_items_inventory
AFTER INSERT ON public.purchase_items
FOR EACH ROW EXECUTE FUNCTION update_inventory();


-- 3. Row Level Security (RLS) policies

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Authenticated Users (Full CRUD for now, can be restricted later)

-- Orders
CREATE POLICY "Enable all for authenticated users" ON public.orders
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Order Items
CREATE POLICY "Enable all for authenticated users" ON public.order_items
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Purchases
CREATE POLICY "Enable all for authenticated users" ON public.purchases
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Purchase Items
CREATE POLICY "Enable all for authenticated users" ON public.purchase_items
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Stock Levels
CREATE POLICY "Enable all for authenticated users" ON public.stock_levels
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- System Logs
CREATE POLICY "Enable insert for authenticated users" ON public.system_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" ON public.system_logs
    FOR SELECT
    TO authenticated
    USING (true);
