CREATE TABLE public.trade_show_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monday_item_id TEXT UNIQUE,
  contact_name TEXT,
  dealer TEXT,
  email TEXT,
  additional_email TEXT,
  phone TEXT,
  trade_show TEXT,
  sales_rep TEXT,
  product_interest TEXT,
  order_amount NUMERIC DEFAULT 0,
  status TEXT,
  notes TEXT,
  lead_date DATE,
  raw JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_show_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all trade show leads"
ON public.trade_show_leads FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Managers read trade show leads"
ON public.trade_show_leads FOR SELECT TO authenticated
USING (public.current_manager_id() IS NOT NULL);

CREATE POLICY "Managers insert trade show leads"
ON public.trade_show_leads FOR INSERT TO authenticated
WITH CHECK (public.current_manager_id() IS NOT NULL OR public.is_admin());

CREATE POLICY "Managers update trade show leads"
ON public.trade_show_leads FOR UPDATE TO authenticated
USING (public.current_manager_id() IS NOT NULL)
WITH CHECK (public.current_manager_id() IS NOT NULL);

CREATE POLICY "Managers delete trade show leads"
ON public.trade_show_leads FOR DELETE TO authenticated
USING (public.current_manager_id() IS NOT NULL);

CREATE TRIGGER trg_trade_show_leads_updated_at
BEFORE UPDATE ON public.trade_show_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_trade_show_leads_show ON public.trade_show_leads(trade_show);
CREATE INDEX idx_trade_show_leads_status ON public.trade_show_leads(status);