-- ============================================================================
-- RLS REPAIR SCRIPT FOR ALL TABLES
-- Patterns:
-- 1. Enable RLS
-- 2. Allow Public Read (SELECT)
-- 3. Allow Public Full Access (ALL) - PERMISSIVE MODE
-- ============================================================================

-- List of tables to apply policies to
-- customers, employees, products, company_settings, sub_companies,
-- orders, order_items, purchases, purchase_items, transactions, stock_levels, system_logs, admins

-- ----------------------------------------------------------------------------
-- 1. Company Settings (Fixing the immediate error)
-- ----------------------------------------------------------------------------
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON company_settings;
-- CREATE POLICY "Allow public read access" ON company_settings FOR SELECT USING (true); -- Covered by ALL

DROP POLICY IF EXISTS "Allow authenticated full access" ON company_settings;
DROP POLICY IF EXISTS "Allow full access for all users" ON company_settings;
CREATE POLICY "Allow full access for all users" ON company_settings
FOR ALL TO public USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 2. Sub Companies
-- ----------------------------------------------------------------------------
ALTER TABLE sub_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON sub_companies;
DROP POLICY IF EXISTS "Allow authenticated full access" ON sub_companies;
DROP POLICY IF EXISTS "Allow full access for all users" ON sub_companies;
CREATE POLICY "Allow full access for all users" ON sub_companies
FOR ALL TO public USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 3. Admins
-- ----------------------------------------------------------------------------
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON admins;
DROP POLICY IF EXISTS "Allow authenticated full access" ON admins;
DROP POLICY IF EXISTS "Allow full access for all users" ON admins;
CREATE POLICY "Allow full access for all users" ON admins
FOR ALL TO public USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 4. Customers
-- ----------------------------------------------------------------------------
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON customers;
DROP POLICY IF EXISTS "Allow authenticated full access" ON customers;
DROP POLICY IF EXISTS "Allow full access for all users" ON customers;
CREATE POLICY "Allow full access for all users" ON customers
FOR ALL TO public USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 5. Employees
-- ----------------------------------------------------------------------------
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON employees;
DROP POLICY IF EXISTS "Allow authenticated full access" ON employees;
DROP POLICY IF EXISTS "Allow full access for all users" ON employees;
CREATE POLICY "Allow full access for all users" ON employees
FOR ALL TO public USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 6. Products
-- ----------------------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON products;
DROP POLICY IF EXISTS "Allow authenticated full access" ON products;
DROP POLICY IF EXISTS "Allow full access for all users" ON products;
CREATE POLICY "Allow full access for all users" ON products
FOR ALL TO public USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 7. Orders
-- ----------------------------------------------------------------------------
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON orders;
DROP POLICY IF EXISTS "Allow authenticated full access" ON orders;
DROP POLICY IF EXISTS "Allow full access for all users" ON orders;
CREATE POLICY "Allow full access for all users" ON orders
FOR ALL TO public USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 8. Order Items
-- ----------------------------------------------------------------------------
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON order_items;
DROP POLICY IF EXISTS "Allow authenticated full access" ON order_items;
DROP POLICY IF EXISTS "Allow full access for all users" ON order_items;
CREATE POLICY "Allow full access for all users" ON order_items
FOR ALL TO public USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 9. Purchases
-- ----------------------------------------------------------------------------
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON purchases;
DROP POLICY IF EXISTS "Allow authenticated full access" ON purchases;
DROP POLICY IF EXISTS "Allow full access for all users" ON purchases;
CREATE POLICY "Allow full access for all users" ON purchases
FOR ALL TO public USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 10. Purchase Items
-- ----------------------------------------------------------------------------
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON purchase_items;
DROP POLICY IF EXISTS "Allow authenticated full access" ON purchase_items;
DROP POLICY IF EXISTS "Allow full access for all users" ON purchase_items;
CREATE POLICY "Allow full access for all users" ON purchase_items
FOR ALL TO public USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 11. Transactions
-- ----------------------------------------------------------------------------
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON transactions;
DROP POLICY IF EXISTS "Allow authenticated full access" ON transactions;
DROP POLICY IF EXISTS "Allow full access for all users" ON transactions;
CREATE POLICY "Allow full access for all users" ON transactions
FOR ALL TO public USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 12. Stock Levels
-- ----------------------------------------------------------------------------
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON stock_levels;
DROP POLICY IF EXISTS "Allow authenticated full access" ON stock_levels;
DROP POLICY IF EXISTS "Allow full access for all users" ON stock_levels;
CREATE POLICY "Allow full access for all users" ON stock_levels
FOR ALL TO public USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 13. System Logs
-- ----------------------------------------------------------------------------
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON system_logs;
DROP POLICY IF EXISTS "Allow authenticated full access" ON system_logs;
DROP POLICY IF EXISTS "Allow full access for all users" ON system_logs;
CREATE POLICY "Allow full access for all users" ON system_logs
FOR ALL TO public USING (true) WITH CHECK (true);
