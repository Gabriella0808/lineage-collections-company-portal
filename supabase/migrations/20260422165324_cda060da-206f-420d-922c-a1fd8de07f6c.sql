CREATE POLICY "Managers insert dealers (temp)"
ON public.dealers
FOR INSERT
TO authenticated
WITH CHECK (is_admin() OR current_manager_id() IS NOT NULL);