-- Add role column to admins table
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin';

-- Update the initial user 'rahul' to be a super_admin
UPDATE admins 
SET role = 'super_admin' 
WHERE username = 'rahul';
