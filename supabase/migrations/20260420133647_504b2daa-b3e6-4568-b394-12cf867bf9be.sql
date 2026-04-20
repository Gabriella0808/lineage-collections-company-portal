-- Consolidate the two "Shindell" rep rows into a single "Jordan Shindell" rep
-- Keep the PA/OH row, rename it, and reassign any references from the Beach row before deleting it.

-- 1. Move dealer assignments from Beach -> PA/OH row
UPDATE public.dealers
SET rep_id = 'ec4bea74-f18b-443c-8729-c3fc54e9fe92'
WHERE rep_id = 'eb2873ce-0e0b-4191-9505-29cb40516881';

-- 2. Move travel log entries
UPDATE public.travel_log
SET rep_id = 'ec4bea74-f18b-443c-8729-c3fc54e9fe92'
WHERE rep_id = 'eb2873ce-0e0b-4191-9505-29cb40516881';

-- 3. Move kpi_records
UPDATE public.kpi_records
SET rep_id = 'ec4bea74-f18b-443c-8729-c3fc54e9fe92'
WHERE rep_id = 'eb2873ce-0e0b-4191-9505-29cb40516881';

-- 4. Move tasks
UPDATE public.tasks
SET rep_id = 'ec4bea74-f18b-443c-8729-c3fc54e9fe92'
WHERE rep_id = 'eb2873ce-0e0b-4191-9505-29cb40516881';

-- 5. Move rep_territories (avoid duplicates)
INSERT INTO public.rep_territories (rep_id, territory_id)
SELECT 'ec4bea74-f18b-443c-8729-c3fc54e9fe92', territory_id
FROM public.rep_territories
WHERE rep_id = 'eb2873ce-0e0b-4191-9505-29cb40516881'
ON CONFLICT DO NOTHING;

DELETE FROM public.rep_territories
WHERE rep_id = 'eb2873ce-0e0b-4191-9505-29cb40516881';

-- 6. Delete the duplicate Beach rep row
DELETE FROM public.sales_reps
WHERE id = 'eb2873ce-0e0b-4191-9505-29cb40516881';

-- 7. Rename the remaining row to "Jordan Shindell"
UPDATE public.sales_reps
SET name = 'Jordan Shindell'
WHERE id = 'ec4bea74-f18b-443c-8729-c3fc54e9fe92';