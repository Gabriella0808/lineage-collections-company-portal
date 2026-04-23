-- Allow managers to view ALL travel log entries (not just their own / their reps')
CREATE POLICY "Managers read all travel_log"
ON public.travel_log
FOR SELECT
TO authenticated
USING (current_manager_id() IS NOT NULL);