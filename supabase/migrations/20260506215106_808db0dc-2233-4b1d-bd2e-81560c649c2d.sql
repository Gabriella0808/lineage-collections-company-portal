CREATE TABLE public.org_position_dotted_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES public.org_positions(id) ON DELETE CASCADE,
  reports_to_id uuid NOT NULL REFERENCES public.org_positions(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_dotted CHECK (position_id <> reports_to_id),
  UNIQUE (position_id, reports_to_id)
);

CREATE INDEX idx_dotted_position ON public.org_position_dotted_reports(position_id);
CREATE INDEX idx_dotted_reports_to ON public.org_position_dotted_reports(reports_to_id);

ALTER TABLE public.org_position_dotted_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read dotted reports"
ON public.org_position_dotted_reports FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins insert dotted reports"
ON public.org_position_dotted_reports FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins update dotted reports"
ON public.org_position_dotted_reports FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins delete dotted reports"
ON public.org_position_dotted_reports FOR DELETE TO authenticated USING (is_admin());