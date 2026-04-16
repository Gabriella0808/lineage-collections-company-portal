
-- Create travel_log table for Monday.com travel data
CREATE TABLE public.travel_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rep_id UUID REFERENCES public.sales_reps(id) ON DELETE CASCADE,
  territory_id UUID REFERENCES public.territories(id) ON DELETE CASCADE,
  travel_date DATE NOT NULL,
  notes TEXT,
  monday_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.travel_log ENABLE ROW LEVEL SECURITY;

-- Allow read access
CREATE POLICY "Allow anon read travel_log" ON public.travel_log FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read travel_log" ON public.travel_log FOR SELECT TO authenticated USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_travel_log_updated_at
BEFORE UPDATE ON public.travel_log
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add bookings and invoices columns to dealer_sales
ALTER TABLE public.dealer_sales ADD COLUMN bookings NUMERIC DEFAULT 0;
ALTER TABLE public.dealer_sales ADD COLUMN invoices NUMERIC DEFAULT 0;
ALTER TABLE public.dealer_sales ADD COLUMN booking_count INTEGER DEFAULT 0;
ALTER TABLE public.dealer_sales ADD COLUMN invoice_count INTEGER DEFAULT 0;
