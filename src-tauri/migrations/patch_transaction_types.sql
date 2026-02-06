-- Drop the existing constraint
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Re-add the constraint with new alloed values
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('expense', 'income', 'transfer', 'purchase', 'order'));
