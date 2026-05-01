INSERT INTO public.dealer_check_ins (dealer_id, user_id, visit_date, notes, brand, new_placement, log_type, outcome)
SELECT
  COALESCE(
    (SELECT id FROM public.dealers WHERE acctivate_id = s.cust_id LIMIT 1),
    (SELECT id FROM public.dealers WHERE lower(name) = lower(s.acct_name) LIMIT 1)
  ) AS dealer_id,
  (SELECT u.id FROM auth.users u WHERE lower(u.email) = s.rep_email LIMIT 1) AS user_id,
  COALESCE(s.visit_date, CURRENT_DATE),
  NULLIF(s.notes,''),
  NULLIF(s.brand,''),
  NULLIF(s.new_placement,''),
  NULLIF(s.log_type,''),
  NULLIF(s.outcome,'')
FROM public._ci_import_stage s
WHERE COALESCE(
    (SELECT id FROM public.dealers WHERE acctivate_id = s.cust_id LIMIT 1),
    (SELECT id FROM public.dealers WHERE lower(name) = lower(s.acct_name) LIMIT 1)
  ) IS NOT NULL
  AND (SELECT u.id FROM auth.users u WHERE lower(u.email) = s.rep_email LIMIT 1) IS NOT NULL;

DROP TABLE public._ci_import_stage;