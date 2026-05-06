CREATE OR REPLACE FUNCTION public.can_view_task_board(_board_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    EXISTS (SELECT 1 FROM public.task_boards b WHERE b.id = _board_id AND b.created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.task_board_members m WHERE m.board_id = _board_id AND m.user_id = auth.uid());
$function$;

DROP POLICY IF EXISTS "View boards (creator/admin/assigned)" ON public.task_boards;
CREATE POLICY "View boards (creator or subscribed)"
ON public.task_boards
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.task_board_members m WHERE m.board_id = id AND m.user_id = auth.uid())
);