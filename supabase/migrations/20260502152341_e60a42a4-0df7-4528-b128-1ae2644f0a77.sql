ALTER TABLE public.email_send_state
ADD COLUMN IF NOT EXISTS per_recipient_throttle_seconds integer NOT NULL DEFAULT 30;