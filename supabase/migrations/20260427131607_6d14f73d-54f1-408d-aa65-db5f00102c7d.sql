-- Create join table for multi-user task assignments
CREATE TABLE IF NOT EXISTS public.manager_task_assignees (
  task_id uuid NOT NULL REFERENCES public.manager_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_manager_task_assignees_user ON public.manager_task_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_manager_task_assignees_task ON public.manager_task_assignees(task_id);

ALTER TABLE public.manager_task_assignees ENABLE ROW LEVEL SECURITY;

-- Helper: can the current user view the parent task?
CREATE OR REPLACE FUNCTION public.can_view_manager_task(_task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.manager_tasks t
    WHERE t.id = _task_id
      AND (
        t.user_id = auth.uid()
        OR (t.assigned_user_id IS NOT NULL AND t.assigned_user_id = auth.uid())
        OR (t.assigned_manager_id IS NOT NULL AND public.is_assigned_manager(t.assigned_manager_id))
        OR EXISTS (
          SELECT 1 FROM public.manager_task_assignees a
          WHERE a.task_id = t.id AND a.user_id = auth.uid()
        )
      )
  )
$$;

-- Helper: is the current user the creator of the task?
CREATE OR REPLACE FUNCTION public.is_manager_task_creator(_task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.manager_tasks t
    WHERE t.id = _task_id AND t.user_id = auth.uid()
  )
$$;

-- RLS policies
CREATE POLICY "View assignees of viewable tasks"
ON public.manager_task_assignees
FOR SELECT
TO authenticated
USING (public.can_view_manager_task(task_id));

CREATE POLICY "Creator can add assignees"
ON public.manager_task_assignees
FOR INSERT
TO authenticated
WITH CHECK (public.is_manager_task_creator(task_id));

CREATE POLICY "Creator or self can remove assignees"
ON public.manager_task_assignees
FOR DELETE
TO authenticated
USING (public.is_manager_task_creator(task_id) OR user_id = auth.uid());

-- Update manager_tasks SELECT/UPDATE policies to include extra assignees
DROP POLICY IF EXISTS "View own or assigned tasks" ON public.manager_tasks;
CREATE POLICY "View own or assigned tasks"
ON public.manager_tasks
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR (assigned_user_id IS NOT NULL AND assigned_user_id = auth.uid())
  OR (assigned_manager_id IS NOT NULL AND is_assigned_manager(assigned_manager_id))
  OR EXISTS (
    SELECT 1 FROM public.manager_task_assignees a
    WHERE a.task_id = manager_tasks.id AND a.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Update own or assigned tasks" ON public.manager_tasks;
CREATE POLICY "Update own or assigned tasks"
ON public.manager_tasks
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR (assigned_user_id IS NOT NULL AND assigned_user_id = auth.uid())
  OR (assigned_manager_id IS NOT NULL AND is_assigned_manager(assigned_manager_id))
  OR EXISTS (
    SELECT 1 FROM public.manager_task_assignees a
    WHERE a.task_id = manager_tasks.id AND a.user_id = auth.uid()
  )
);

-- Notify when a user is added as an assignee
CREATE OR REPLACE FUNCTION public.notify_task_assignee_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_row public.manager_tasks%ROWTYPE;
  assigner_name text;
BEGIN
  SELECT * INTO task_row FROM public.manager_tasks WHERE id = NEW.task_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  IF NEW.user_id = task_row.user_id THEN RETURN NEW; END IF;

  SELECT COALESCE(NULLIF(p.full_name, ''), 'Someone')
    INTO assigner_name
  FROM public.profiles p WHERE p.user_id = task_row.user_id;

  INSERT INTO public.notifications (user_id, type, title, body, link, related_id)
  VALUES (
    NEW.user_id,
    'task_assigned',
    COALESCE(assigner_name, 'Someone') || ' assigned a task to you',
    task_row.title,
    '/tasks',
    task_row.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_task_assignee_added ON public.manager_task_assignees;
CREATE TRIGGER trg_notify_task_assignee_added
AFTER INSERT ON public.manager_task_assignees
FOR EACH ROW EXECUTE FUNCTION public.notify_task_assignee_added();