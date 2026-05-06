import type { InventoryItem } from "@/data/inventoryMock";

// Lead time per Acctivate model (~32 weeks from PO to delivery)
export const LEAD_TIME_WEEKS = 32;
// Reorder point multiplier from the Excel model: Sales/Week × 4.5 × 4.5 = ×20.25
export const REORDER_POINT_WEEKS = 20.25;
const WEEKS_PER_MONTH = 4.333;

/** Sales per week, derived from avg monthly sales (LTM). */
export function salesPerWeek(it: Pick<InventoryItem, "avgMonthlySales">): number {
  return (it.avgMonthlySales || 0) / WEEKS_PER_MONTH;
}

/**
 * Weeks of supply = (Available + On PO) ÷ Sales/Week
 * Mirrors the InvCut spreadsheet "Weeks" column: =(N+R)/L
 * where N = SUM(Available, On PO) and L = Sales/Week.
 */
export function weeksOfSupply(it: InventoryItem): number | null {
  const sw = salesPerWeek(it);
  if (sw <= 0) return null;
  const pipeline = (it.available ?? it.onHand) + (it.onPo ?? 0);
  return pipeline / sw;
}

/** "New Min" reorder point: Sales/Week × 20.25 */
export function reorderPoint(it: InventoryItem): number {
  return Math.round(salesPerWeek(it) * REORDER_POINT_WEEKS);
}

/** Color tone for a weeks-of-supply value, anchored on the 32-week lead time. */
export function weeksTone(weeks: number | null): string {
  if (weeks == null) return "text-muted-foreground";
  if (weeks < LEAD_TIME_WEEKS * 0.5) return "text-destructive font-semibold"; // <16 wks
  if (weeks < LEAD_TIME_WEEKS) return "text-amber-600 font-medium"; // <32 wks
  if (weeks > LEAD_TIME_WEEKS * 2) return "text-blue-600"; // >64 wks overstock
  return "text-foreground";
}
