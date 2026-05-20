
DROP TRIGGER IF EXISTS trg_resolve_dealer_acctivate_links ON public.dealers;

CREATE TRIGGER trg_resolve_dealer_acctivate_links
BEFORE INSERT OR UPDATE OF salesperson, territory, sales_manager
ON public.dealers
FOR EACH ROW
EXECUTE FUNCTION public.resolve_dealer_acctivate_links();

-- Backfill: nudge existing rows through the trigger so rep_id / territory_id / manager_id resolve
UPDATE public.dealers
SET salesperson = salesperson
WHERE salesperson IS NOT NULL OR territory IS NOT NULL OR sales_manager IS NOT NULL;
