
DROP POLICY IF EXISTS "Admins view all tasks" ON public.manager_tasks;
DROP POLICY IF EXISTS "Admins update all tasks" ON public.manager_tasks;
DROP POLICY IF EXISTS "Admins delete all tasks" ON public.manager_tasks;
DROP POLICY IF EXISTS "Admins view all task assignees" ON public.manager_task_assignees;
DROP POLICY IF EXISTS "Admins manage task assignees" ON public.manager_task_assignees;

-- Helper: identifies trade show lead follow-up tasks
CREATE OR REPLACE FUNCTION public.is_trade_show_task(_task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.manager_tasks t
    WHERE t.id = _task_id
      AND (
        t.description ~* '—\s*Lead from\b'
        OR t.description ~* '\mTrade Show\M'
        OR t.title ~* '\mTrade Show\M'
      )
  )
$$;

-- Admins can view trade show follow-up tasks only
CREATE POLICY "Admins view trade show tasks"
ON public.manager_tasks
FOR SELECT TO authenticated
USING (
  is_admin() AND (
    description ~* '—\s*Lead from\b'
    OR description ~* '\mTrade Show\M'
    OR title ~* '\mTrade Show\M'
  )
);

-- Admins can view assignees of trade show follow-up tasks only
CREATE POLICY "Admins view trade show task assignees"
ON public.manager_task_assignees
FOR SELECT TO authenticated
USING (is_admin() AND public.is_trade_show_task(task_id));
