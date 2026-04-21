import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, Download, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InventoryItem } from "@/data/inventoryMock";

interface ReorderAnalysisProps {
  items: InventoryItem[];
}

interface ReorderRow {
  sku: string;
  product: string;
  collection: string;
  supplier: string;
  onHand: number;
  available: number;
  salesPerWeek: number;
  newMin: number;
  netAvail: number;
  overUnder: number;
  suggestedOrder: number;
  weeksOfCover: number | null;
}

/**
 * Replicates the InvCut spreadsheet model:
 *   Sales/Week = Avg Monthly Sales / 4.33
 *   New Min    = Sales/Week × leadWeeks × safetyWeeks   (default 4.5 × 4.5 = 20.25)
 *   Net Avail  = Available  (Acctivate sync — On PO not yet synced)
 *   Over/Under = Net Avail − New Min  (negative → needs reorder)
 *   Suggested  = ceil(New Min − Net Avail) when negative
 *   Weeks      = Net Avail / Sales/Week
 */
export function ReorderAnalysis({ items }: ReorderAnalysisProps) {
  const [leadWeeks, setLeadWeeks] = useState(4.5);
  const [safetyWeeks, setSafetyWeeks] = useState(4.5);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const rows = useMemo<ReorderRow[]>(() => {
    return items
      .map<ReorderRow>((it) => {
        const salesPerWeek = (it.avgMonthlySales || 0) / 4.33;
        const newMin = salesPerWeek * leadWeeks * safetyWeeks;
        const netAvail = it.available;
        const overUnder = netAvail - newMin;
        const suggestedOrder = overUnder < 0 ? Math.ceil(Math.abs(overUnder)) : 0;
        const weeksOfCover = salesPerWeek > 0 ? netAvail / salesPerWeek : null;
        return {
          sku: it.sku,
          product: it.product,
          collection: it.collection,
          supplier: it.supplier,
          onHand: it.onHand,
          available: it.available,
          salesPerWeek,
          newMin,
          netAvail,
          overUnder,
          suggestedOrder,
          weeksOfCover,
        };
      })
      .filter((r) => r.suggestedOrder > 0)
      .sort((a, b) => a.overUnder - b.overUnder); // most negative first
  }, [items, leadWeeks, safetyWeeks]);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (r) =>
        r.sku.toLowerCase().includes(q) ||
        r.product.toLowerCase().includes(q) ||
        r.collection.toLowerCase().includes(q) ||
        r.supplier.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totals = useMemo(() => {
    return {
      skus: rows.length,
      units: rows.reduce((acc, r) => acc + r.suggestedOrder, 0),
      collections: new Set(rows.map((r) => r.collection)).size,
    };
  }, [rows]);

  function exportCsv() {
    const headers = [
      "SKU", "Product", "Collection", "Supplier",
      "On Hand", "Available", "Sales/Week",
      "New Min", "Net Avail", "Over/Under", "Suggested Order", "Weeks of Cover",
    ];
    const lines = [headers.join(",")];
    for (const r of filtered) {
      lines.push([
        `"${r.sku}"`,
        `"${r.product.replace(/"/g, '""')}"`,
        `"${r.collection}"`,
        `"${r.supplier}"`,
        r.onHand,
        r.available,
        r.salesPerWeek.toFixed(2),
        Math.round(r.newMin),
        r.netAvail,
        Math.round(r.overUnder),
        r.suggestedOrder,
        r.weeksOfCover == null ? "" : r.weeksOfCover.toFixed(1),
      ].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reorder-analysis-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning-foreground" />
            Reorder Analysis
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Replicates the InvCut model:&nbsp;
            <span className="font-mono">New Min = Sales/Week × {leadWeeks} × {safetyWeeks}</span>.
            SKUs where Net Available is below New Min are flagged.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={filtered.length === 0} className="h-8">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-lg border border-border p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">SKUs to Reorder</div>
          <div className="text-2xl font-semibold mt-1 tabular-nums text-warning-foreground">{totals.skus}</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Total Units</div>
          <div className="text-2xl font-semibold mt-1 tabular-nums">{totals.units.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Collections</div>
          <div className="text-2xl font-semibold mt-1 tabular-nums">{totals.collections}</div>
        </div>
        <div className="rounded-lg border border-border p-3 space-y-1">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Lead time (weeks)</Label>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={leadWeeks}
            onChange={(e) => setLeadWeeks(Math.max(0, Number(e.target.value) || 0))}
            className="h-8"
          />
        </div>
        <div className="rounded-lg border border-border p-3 space-y-1">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Safety stock (weeks)</Label>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={safetyWeeks}
            onChange={(e) => setSafetyWeeks(Math.max(0, Number(e.target.value) || 0))}
            className="h-8"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>
          Net Avail uses synced <strong>Available</strong> from Acctivate. Open POs aren't synced yet — once added, they'll be included in Net Avail.
        </span>
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search SKU, product, collection, supplier…"
          className="pl-8 h-9"
        />
      </div>

      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">SKU / Product</th>
              <th className="text-left px-4 py-3 font-medium">Collection</th>
              <th className="text-right px-4 py-3 font-medium">On Hand</th>
              <th className="text-right px-4 py-3 font-medium">Available</th>
              <th className="text-right px-4 py-3 font-medium">Sales/Wk</th>
              <th className="text-right px-4 py-3 font-medium">New Min</th>
              <th className="text-right px-4 py-3 font-medium">Over/Under</th>
              <th className="text-right px-4 py-3 font-medium">Weeks Cover</th>
              <th className="text-right px-4 py-3 font-medium">Suggested Order</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => {
              const severity = r.weeksOfCover != null && r.weeksOfCover < 2 ? "critical" : "warning";
              return (
                <tr key={r.sku} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.product}</div>
                    <div className="text-xs text-muted-foreground font-mono">{r.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.collection}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.onHand}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.available}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.salesPerWeek.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{Math.round(r.newMin)}</td>
                  <td className={cn(
                    "px-4 py-3 text-right tabular-nums font-semibold",
                    r.overUnder < 0 ? "text-destructive" : "text-success",
                  )}>
                    {Math.round(r.overUnder)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.weeksOfCover == null ? "—" : r.weeksOfCover.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "tabular-nums font-semibold",
                        severity === "critical"
                          ? "bg-destructive/10 text-destructive border-destructive/30"
                          : "bg-warning/15 text-warning-foreground border-warning/30",
                      )}
                    >
                      {r.suggestedOrder}
                    </Badge>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                  No SKUs need reordering with the current parameters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm pt-2">
          <div className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">{(currentPage - 1) * PAGE_SIZE + 1}</span>–
            <span className="font-medium text-foreground">{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> of{" "}
            <span className="font-medium text-foreground">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
              Previous
            </Button>
            <span className="text-muted-foreground tabular-nums">
              Page {currentPage} of {totalPages}
            </span>
            <Button size="sm" variant="outline" className="h-8" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
