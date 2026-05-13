import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const TARGET_MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
] as const;
export type TargetMonth = typeof TARGET_MONTHS[number];

// Maps short month label used elsewhere ('Jan'..'Dec') to target column key.
export const MONTH_LABEL_TO_KEY: Record<string, TargetMonth> = {
  Jan: "jan", Feb: "feb", Mar: "mar", Apr: "apr", May: "may", Jun: "jun",
  Jul: "jul", Aug: "aug", Sep: "sep", Oct: "oct", Nov: "nov", Dec: "dec",
};

export interface RepTarget {
  id: string;
  rep_id: string;
  year: number;
  annual_target: number;
  jan: number; feb: number; mar: number; apr: number; may: number; jun: number;
  jul: number; aug: number; sep: number; oct: number; nov: number; dec: number;
  notes: string | null;
}

export function useRepTargets(year: number) {
  return useQuery({
    queryKey: ["rep_targets", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rep_targets" as any)
        .select("*")
        .eq("year", year);
      if (error) throw error;
      return (data ?? []) as unknown as RepTarget[];
    },
  });
}

export function useUpsertRepTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<RepTarget> & { rep_id: string; year: number }) => {
      const { data, error } = await supabase
        .from("rep_targets" as any)
        .upsert(row, { onConflict: "rep_id,year" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["rep_targets", vars.year] });
    },
  });
}
