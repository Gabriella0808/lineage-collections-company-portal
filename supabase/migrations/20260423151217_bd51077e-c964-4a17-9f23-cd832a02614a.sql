ALTER TABLE public.dealer_check_ins
  ADD COLUMN IF NOT EXISTS log_type text,
  ADD COLUMN IF NOT EXISTS new_placement text,
  ADD COLUMN IF NOT EXISTS brand text;