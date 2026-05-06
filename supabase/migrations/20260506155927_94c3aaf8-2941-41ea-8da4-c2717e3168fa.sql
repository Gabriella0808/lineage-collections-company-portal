
-- Boards (Monday-style) for organizing tasks
CREATE TABLE public.task_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.task_board_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.task_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link tasks to optional board/group
ALTER TABLE public.manager_tasks
  ADD COLUMN board_id UUID REFERENCES public.task_boards(id) ON DELETE SET NULL,
  ADD COLUMN group_id UUID REFERENCES public.task_board_groups(id) ON DELETE SET NULL,
  ADD COLUMN position INTEGER;

CREATE INDEX idx_manager_tasks_board ON public.manager_tasks(board_id);
CREATE INDEX idx_manager_tasks_group ON public.manager_tasks(group_id);
CREATE INDEX idx_task_board_groups_board ON public.task_board_groups(board_id);

-- Helper: can the current user view this board?
-- Visible to creator, admins, or anyone assigned to a task on the board.
CREATE OR REPLACE FUNCTION public.can_view_task_board(_board_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.task_boards b WHERE b.id = _board_id AND b.created_by = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.manager_tasks t
      WHERE t.board_id = _board_id
        AND (
          t.user_id = auth.uid()
          OR t.assigned_user_id = auth.uid()
          OR (t.assigned_manager_id IS NOT NULL AND public.is_assigned_manager(t.assigned_manager_id))
          OR EXISTS (SELECT 1 FROM public.manager_task_assignees a WHERE a.task_id = t.id AND a.user_id = auth.uid())
        )
    );
$$;

-- RLS
ALTER TABLE public.task_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_board_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View boards (creator/admin/assigned)"
ON public.task_boards FOR SELECT TO authenticated
USING (public.can_view_task_board(id));

CREATE POLICY "Create own boards"
ON public.task_boards FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Update own boards"
ON public.task_boards FOR UPDATE TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Delete own boards"
ON public.task_boards FOR DELETE TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "View groups of viewable boards"
ON public.task_board_groups FOR SELECT TO authenticated
USING (public.can_view_task_board(board_id));

CREATE POLICY "Manage groups on own boards"
ON public.task_board_groups FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.task_boards b WHERE b.id = board_id AND b.created_by = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.task_boards b WHERE b.id = board_id AND b.created_by = auth.uid()));

-- updated_at triggers
CREATE TRIGGER trg_task_boards_updated
BEFORE UPDATE ON public.task_boards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_task_board_groups_updated
BEFORE UPDATE ON public.task_board_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
