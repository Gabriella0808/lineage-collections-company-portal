
-- Normalization function: maps Acctivate raw codes to proper brand/collection
CREATE OR REPLACE FUNCTION public.normalize_product_taxonomy()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  raw_brand_code text;
  raw_collection text;
BEGIN
  -- The sync places the brand code into `collection` and the actual collection name into `category`.
  -- Detect that case: if `collection` is one of the known codes, treat it as the brand source.
  raw_brand_code := upper(coalesce(NEW.collection, ''));
  raw_collection := NEW.category;

  IF raw_brand_code IN ('SW','FINNLOU','LUX','FREIGHTI','FREIGHTO','MISC','ALLOW','TARIFF') THEN
    NEW.brand := CASE raw_brand_code
      WHEN 'SW'       THEN 'Sea Winds'
      WHEN 'FINNLOU'  THEN 'Finn & Louise'
      WHEN 'LUX'      THEN 'Lux Lighting'
      WHEN 'FREIGHTI' THEN 'Freight'
      WHEN 'FREIGHTO' THEN 'Freight'
      WHEN 'MISC'     THEN 'Misc'
      WHEN 'ALLOW'    THEN 'Allowance'
      WHEN 'TARIFF'   THEN 'Tariff'
    END;
    NEW.collection := raw_collection;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_product_taxonomy ON public.products;
CREATE TRIGGER trg_normalize_product_taxonomy
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.normalize_product_taxonomy();

-- Backfill existing rows: trigger fires on UPDATE
UPDATE public.products
SET collection = collection
WHERE collection IS NOT NULL;
