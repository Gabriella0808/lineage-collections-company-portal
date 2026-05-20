
ALTER TABLE public.dealers
  ADD COLUMN IF NOT EXISTS sales_manager text,
  ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.managers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_dealers_manager_id ON public.dealers(manager_id);

CREATE OR REPLACE FUNCTION public.resolve_dealer_acctivate_links()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  rep_name_clean text;
  mgr_name_clean text;
  matched_rep_id uuid;
  matched_territory_id uuid;
  matched_manager_id uuid;
  new_territory_id uuid;
BEGIN
  -- Salesperson -> rep_id
  IF NEW.salesperson IS NOT NULL AND length(trim(NEW.salesperson)) > 0 THEN
    rep_name_clean := trim(regexp_replace(NEW.salesperson, '\s*\([^)]*\)\s*$', ''));
    SELECT id INTO matched_rep_id
    FROM public.sales_reps
    WHERE lower(name) = lower(rep_name_clean)
    LIMIT 1;
    IF matched_rep_id IS NOT NULL THEN
      NEW.rep_id := matched_rep_id;
    END IF;
  END IF;

  -- Territory -> territory_id (auto-create if missing)
  IF NEW.territory IS NOT NULL AND length(trim(NEW.territory)) > 0 THEN
    SELECT id INTO matched_territory_id
    FROM public.territories
    WHERE lower(name) = lower(trim(NEW.territory))
    LIMIT 1;
    IF matched_territory_id IS NULL THEN
      INSERT INTO public.territories (name) VALUES (trim(NEW.territory))
      RETURNING id INTO new_territory_id;
      NEW.territory_id := new_territory_id;
    ELSE
      NEW.territory_id := matched_territory_id;
    END IF;
  END IF;

  -- Sales Manager -> manager_id
  IF NEW.sales_manager IS NOT NULL AND length(trim(NEW.sales_manager)) > 0 THEN
    mgr_name_clean := trim(regexp_replace(NEW.sales_manager, '\s*\([^)]*\)\s*$', ''));
    -- Exact match first
    SELECT id INTO matched_manager_id
    FROM public.managers
    WHERE lower(name) = lower(mgr_name_clean)
    LIMIT 1;
    -- Fallback: managers.name starts with the Acctivate value (e.g. "Will" -> "Will Grisack")
    IF matched_manager_id IS NULL THEN
      SELECT id INTO matched_manager_id
      FROM public.managers
      WHERE lower(name) LIKE lower(mgr_name_clean) || ' %'
         OR lower(name) = lower(mgr_name_clean)
      ORDER BY length(name)
      LIMIT 1;
    END IF;
    IF matched_manager_id IS NOT NULL THEN
      NEW.manager_id := matched_manager_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
