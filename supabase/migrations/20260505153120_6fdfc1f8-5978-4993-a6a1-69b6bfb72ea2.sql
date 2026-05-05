
-- Extend inventory with value/closeout/factory/forecast fields
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS unit_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS list_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_closeout boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_discontinued boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS factory text,
  ADD COLUMN IF NOT EXISTS moq integer,
  ADD COLUMN IF NOT EXISTS lead_time_days integer,
  ADD COLUMN IF NOT EXISTS forecast_monthly numeric;

-- Open sales orders backlog (line-level)
CREATE TABLE IF NOT EXISTS public.open_sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acctivate_id text,
  order_number text,
  sku text NOT NULL,
  dealer_id uuid,
  dealer_name text,
  qty_open numeric NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  extended_value numeric NOT NULL DEFAULT 0,
  order_date date,
  promised_date date,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.open_sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read open_sales_orders" ON public.open_sales_orders
  FOR SELECT TO authenticated USING (true);

-- Purchase orders header + lines
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acctivate_id text,
  po_number text,
  factory text,
  status text,
  order_date date,
  eta date,
  total_value numeric NOT NULL DEFAULT 0,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read purchase_orders" ON public.purchase_orders
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.purchase_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  sku text NOT NULL,
  qty_ordered numeric NOT NULL DEFAULT 0,
  qty_received numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  eta date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read purchase_order_lines" ON public.purchase_order_lines
  FOR SELECT TO authenticated USING (true);

-- Per-sku monthly sales history (for trends, turnover, forecast vs reality)
CREATE TABLE IF NOT EXISTS public.sku_sales_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  units_sold numeric NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  forecast_units numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sku, year, month)
);
ALTER TABLE public.sku_sales_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read sku_sales_history" ON public.sku_sales_history
  FOR SELECT TO authenticated USING (true);

-- Lost sales events (stock-out backorders / cancellations)
CREATE TABLE IF NOT EXISTS public.lost_sales_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL,
  event_date date NOT NULL,
  qty_requested numeric NOT NULL DEFAULT 0,
  estimated_value numeric NOT NULL DEFAULT 0,
  reason text,
  dealer_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lost_sales_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read lost_sales_events" ON public.lost_sales_events
  FOR SELECT TO authenticated USING (true);

-- Dealer demand signals (quote/inquiry/wishlist hits per sku)
CREATE TABLE IF NOT EXISTS public.dealer_demand_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL,
  dealer_id uuid,
  dealer_name text,
  signal_type text NOT NULL,
  signal_strength numeric NOT NULL DEFAULT 1,
  signal_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dealer_demand_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read dealer_demand_signals" ON public.dealer_demand_signals
  FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_open_sales_orders_sku ON public.open_sales_orders(sku);
CREATE INDEX IF NOT EXISTS idx_po_lines_sku ON public.purchase_order_lines(sku);
CREATE INDEX IF NOT EXISTS idx_sku_sales_history_sku ON public.sku_sales_history(sku, year, month);
CREATE INDEX IF NOT EXISTS idx_lost_sales_sku ON public.lost_sales_events(sku);
CREATE INDEX IF NOT EXISTS idx_demand_signals_sku ON public.dealer_demand_signals(sku);
