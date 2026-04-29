-- Allow any authenticated manager to read all managers (so Manager/Manager Email columns populate
-- in the Sales Rep Database for non-admin manager accounts like Will).
CREATE POLICY "Managers read all managers"
ON public.managers
FOR SELECT
TO authenticated
USING (current_manager_id() IS NOT NULL);