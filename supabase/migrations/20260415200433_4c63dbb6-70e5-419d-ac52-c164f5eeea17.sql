
CREATE POLICY "Allow anon read sales_reps" ON public.sales_reps FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read territories" ON public.territories FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read dealers" ON public.dealers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read activities" ON public.activities FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read contacts" ON public.contacts FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read rep_territories" ON public.rep_territories FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read managers" ON public.managers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read kpi_records" ON public.kpi_records FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read tasks" ON public.tasks FOR SELECT TO anon USING (true);
