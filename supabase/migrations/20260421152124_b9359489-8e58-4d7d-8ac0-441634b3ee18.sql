
-- Inventory SKU master synced from Acctivate
CREATE TABLE public.inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  acctivate_id text UNIQUE,
  sku text NOT NULL,
  product text NOT NULL,
  collection text,
  supplier text,
  on_hand numeric DEFAULT 0,
  available numeric DEFAULT 0,
  avg_monthly_sales numeric DEFAULT 0,
  months_supply numeric,
  status text,
  link text,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_status ON public.inventory(status);
CREATE INDEX idx_inventory_collection ON public.inventory(collection);
CREATE INDEX idx_inventory_sku ON public.inventory(sku);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read inventory"
  ON public.inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow anon read inventory"
  ON public.inventory FOR SELECT
  TO anon
  USING (true);

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
