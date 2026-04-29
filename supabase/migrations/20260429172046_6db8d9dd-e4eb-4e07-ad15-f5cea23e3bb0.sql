
-- sales_reps: allow admins + managers to insert/update/delete
CREATE POLICY "Admins manage sales_reps"
ON public.sales_reps FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Managers manage sales_reps"
ON public.sales_reps FOR ALL TO authenticated
USING (current_manager_id() IS NOT NULL)
WITH CHECK (current_manager_id() IS NOT NULL);

-- managers table
CREATE POLICY "Admins manage managers"
ON public.managers FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Managers insert/update managers"
ON public.managers FOR INSERT TO authenticated
WITH CHECK (current_manager_id() IS NOT NULL);

CREATE POLICY "Managers update managers row"
ON public.managers FOR UPDATE TO authenticated
USING (current_manager_id() IS NOT NULL)
WITH CHECK (current_manager_id() IS NOT NULL);

-- territories table
CREATE POLICY "Admins manage territories"
ON public.territories FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Managers manage territories"
ON public.territories FOR ALL TO authenticated
USING (current_manager_id() IS NOT NULL)
WITH CHECK (current_manager_id() IS NOT NULL);

-- rep_territories
CREATE POLICY "Admins manage rep_territories"
ON public.rep_territories FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Managers manage rep_territories"
ON public.rep_territories FOR ALL TO authenticated
USING (current_manager_id() IS NOT NULL)
WITH CHECK (current_manager_id() IS NOT NULL);
