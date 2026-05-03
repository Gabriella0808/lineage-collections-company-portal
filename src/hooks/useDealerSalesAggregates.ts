import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MonthlyAgg = {
  /** Long month name, e.g. "January" */
  m: string;
  b25: number;
  i25: number;
  ytdB: number;
  ytdI: number;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Fetches dealer_sales rows for the current and previous calendar year and
 * aggregates them by month. Returns one row per month with:
 *   - b25 / i25  → previous-year bookings & invoices actuals
 *   - ytdB / ytdI → current-year YTD bookings & invoices actuals
 */
export function useDealerSalesAggregates() {
  const [data, setData] = useState<MonthlyAgg[]>(() => emptyYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;

    (async () => {
      setLoading(true);
      // dealer_sales is small (~3k rows); fetch both years in one query.
      const { data: rows, error } = await supabase
        .from("dealer_sales")
        .select("year, month, invoices, bookings")
        .in("year", [currentYear, prevYear]);

      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const agg: Record<string, MonthlyAgg> = Object.fromEntries(
        MONTH_NAMES.map((m) => [m, { m, b25: 0, i25: 0, ytdB: 0, ytdI: 0 }]),
      );

      for (const r of rows ?? []) {
        const monthIdx = parseInt(String(r.month), 10) - 1;
        if (monthIdx < 0 || monthIdx > 11) continue;
        const name = MONTH_NAMES[monthIdx];
        const inv = Number(r.invoices) || 0;
        const bk = Number(r.bookings) || 0;
        if (r.year === currentYear) {
          agg[name].ytdI += inv;
          agg[name].ytdB += bk;
        } else if (r.year === prevYear) {
          agg[name].i25 += inv;
          agg[name].b25 += bk;
        }
      }

      setData(MONTH_NAMES.map((m) => agg[m]));
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

function emptyYear(): MonthlyAgg[] {
  return MONTH_NAMES.map((m) => ({ m, b25: 0, i25: 0, ytdB: 0, ytdI: 0 }));
}
