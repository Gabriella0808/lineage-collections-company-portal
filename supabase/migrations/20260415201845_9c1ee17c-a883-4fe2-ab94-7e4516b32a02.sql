ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS monday_id text UNIQUE;
CREATE UNIQUE INDEX IF NOT EXISTS managers_email_key ON public.managers (email);