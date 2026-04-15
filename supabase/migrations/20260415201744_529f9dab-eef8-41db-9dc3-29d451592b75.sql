ALTER TABLE public.sales_reps ADD COLUMN IF NOT EXISTS monday_id text UNIQUE;
ALTER TABLE public.territories ADD COLUMN IF NOT EXISTS monday_id text UNIQUE;