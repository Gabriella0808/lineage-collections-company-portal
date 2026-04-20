
-- Helper: returns true if the given manager's email matches the current auth user's email
CREATE OR REPLACE FUNCTION public.is_assigned_manager(_manager_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.managers m
    JOIN auth.users u ON lower(u.email) = lower(m.email)
    WHERE m.id = _manager_id
      AND u.id = auth.uid()
  )
$$;

-- Drop old policies
DROP POLICY IF EXISTS "Users view own tasks" ON public.manager_tasks;
DROP POLICY IF EXISTS "Users update own tasks" ON public.manager_tasks;
DROP POLICY IF EXISTS "Users delete own tasks" ON public.manager_tasks;

-- View: own tasks OR tasks assigned to me
CREATE POLICY "View own or assigned tasks"
ON public.manager_tasks
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR (assigned_manager_id IS NOT NULL AND public.is_assigned_manager(assigned_manager_id))
);

-- Update: own tasks OR tasks assigned to me (so assignees can change status)
CREATE POLICY "Update own or assigned tasks"
ON public.manager_tasks
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR (assigned_manager_id IS NOT NULL AND public.is_assigned_manager(assigned_manager_id))
);

-- Delete: only the creator can delete
CREATE POLICY "Creator can delete tasks"
ON public.manager_tasks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
