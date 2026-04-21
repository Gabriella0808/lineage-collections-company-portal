import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { InventoryItem, InventoryStatus } from "@/data/inventoryMock";
import { inventoryItems as mockInventory } from "@/data/inventoryMock";

interface DbInventoryRow {
  id: string;
  sku: string;
  product: string;
  collection: string | null;
  supplier: string | null;
  on_hand: number | null;
  available: number | null;
  avg_monthly_sales: number | null;
  months_supply: number | null;
  status: string | null;
  link: string | null;
  last_synced_at: string | null;
}

function deriveStatus(onHand: number, monthsSupply: number | null): InventoryStatus {
  if (onHand <= 0) return "out-of-stock";
  if (onHand <= 5) return "critical";
  if (onHand <= 20) return "reorder-soon";
  if (monthsSupply != null && monthsSupply > 12) return "overstock";
  if (monthsSupply != null && monthsSupply >= 3) return "fast-moving";
  return "healthy";
}

const ALLOWED: ReadonlySet<InventoryStatus> = new Set([
  "out-of-stock", "critical", "reorder-soon", "stockout-risk",
  "fast-moving", "overstock", "liquidate", "healthy",
]);

function normalizeStatus(raw: string | null, onHand: number, monthsSupply: number | null): InventoryStatus {
  if (raw && ALLOWED.has(raw as InventoryStatus)) return raw as InventoryStatus;
  return deriveStatus(onHand, monthsSupply);
}

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, sku, product, collection, supplier, on_hand, available, avg_monthly_sales, months_supply, status, link, last_synced_at")
        .order("status", { ascending: true })
        .limit(1000);

      if (!active) return;

      if (error || !data || data.length === 0) {
        setItems(mockInventory);
        setUsingMock(true);
        setLoading(false);
        return;
      }

      const rows = (data as DbInventoryRow[]).map((r) => {
        const onHand = Number(r.on_hand ?? 0);
        const available = Number(r.available ?? 0);
        const avg = Number(r.avg_monthly_sales ?? 0);
        const mos = r.months_supply == null ? null : Number(r.months_supply);
        return {
          sku: r.sku,
          product: r.product,
          collection: r.collection ?? "Uncategorized",
          supplier: r.supplier ?? "—",
          onHand,
          available,
          avgMonthlySales: avg,
          monthsSupply: mos,
          status: normalizeStatus(r.status, onHand, mos),
          link: r.link ?? undefined,
        } satisfies InventoryItem;
      });

      const newest = data.reduce<string | null>((acc, r) => {
        const t = (r as DbInventoryRow).last_synced_at;
        if (!t) return acc;
        if (!acc || t > acc) return t;
        return acc;
      }, null);

      setItems(rows);
      setLastSyncedAt(newest);
      setUsingMock(false);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  return { items, loading, lastSyncedAt, usingMock };
}
