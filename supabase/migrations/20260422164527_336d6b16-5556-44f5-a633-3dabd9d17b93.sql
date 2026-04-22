DROP POLICY IF EXISTS "Managers insert check-ins" ON public.dealer_check_ins;

CREATE POLICY "Managers insert check-ins (temp)"
ON public.dealer_check_ins
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (is_admin() OR current_manager_id() IS NOT NULL)
);