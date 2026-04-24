ALTER TABLE public.dealers ADD COLUMN IF NOT EXISTS rep_owner text;
CREATE INDEX IF NOT EXISTS idx_dealers_rep_owner ON public.dealers(rep_owner);