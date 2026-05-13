
CREATE TABLE public.rep_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid NOT NULL,
  year integer NOT NULL,
  annual_target numeric NOT NULL DEFAULT 0,
  jan numeric NOT NULL DEFAULT 0,
  feb numeric NOT NULL DEFAULT 0,
  mar numeric NOT NULL DEFAULT 0,
  apr numeric NOT NULL DEFAULT 0,
  may numeric NOT NULL DEFAULT 0,
  jun numeric NOT NULL DEFAULT 0,
  jul numeric NOT NULL DEFAULT 0,
  aug numeric NOT NULL DEFAULT 0,
  sep numeric NOT NULL DEFAULT 0,
  oct numeric NOT NULL DEFAULT 0,
  nov numeric NOT NULL DEFAULT 0,
  "dec" numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (rep_id, year)
);

ALTER TABLE public.rep_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage rep_targets"
  ON public.rep_targets FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Managers read team rep_targets"
  ON public.rep_targets FOR SELECT TO authenticated
  USING (rep_id IN (SELECT public.current_manager_rep_ids()));

CREATE POLICY "Reps read own rep_targets"
  ON public.rep_targets FOR SELECT TO authenticated
  USING (rep_id = public.current_rep_id());

CREATE TRIGGER trg_rep_targets_updated_at
  BEFORE UPDATE ON public.rep_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_rep_targets_year ON public.rep_targets(year);
CREATE INDEX idx_rep_targets_rep ON public.rep_targets(rep_id);
