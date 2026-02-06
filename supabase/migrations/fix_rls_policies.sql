-- Enable RLS on the table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 1. Allow public read access (Required for login check)
DROP POLICY IF EXISTS "Allow public read access" ON admins;
CREATE POLICY "Allow public read access" ON admins
FOR SELECT USING (true);

-- 2. Allow full access for authenticated users (Required for Admin Management)
-- This allows logged-in admins to Add/Update/Delete other admins
DROP POLICY IF EXISTS "Allow authenticated full access" ON admins;
CREATE POLICY "Allow authenticated full access" ON admins
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
