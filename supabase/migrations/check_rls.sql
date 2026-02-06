-- Check if RLS is enabled on admins table
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'admins';

-- Check policies on admins table
SELECT * FROM pg_policies WHERE tablename = 'admins';
