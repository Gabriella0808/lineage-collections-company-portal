-- Add visibility column to manager_tasks: 'public' (default) or 'private'
ALTER TABLE public.manager_tasks
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public','private'));

-- Allow any authenticated user to view public tasks
CREATE POLICY "Anyone can view public tasks"
  ON public.manager_tasks
  FOR SELECT
  TO authenticated
  USING (visibility = 'public');
