CREATE POLICY "Managers read all check-ins (temp)"
ON public.dealer_check_ins
FOR SELECT
TO authenticated
USING (public.current_manager_id() IS NOT NULL);