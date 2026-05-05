import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, PackageOpen, TrendingUp, TrendingDown, Tag, Activity,
  Truck, Factory, Target, Radio, AlertCircle, ShoppingCart, Archive,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import type { InventoryItem } from "@/data/inventoryMock";
import { useInventoryHub } from "@/hooks/useInventoryHub";
import { cn } from "@/lib/utils";

const fmtMoney = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` :
  n >= 1_000 ? `$${(n / 1_000).toFixed(1)}K` :
  `$${n.toFixed(0)}`;
const fmtNum = (n: number) => n.toLocaleString();

function KPI({ label, value, hint, icon: Icon, accent }: {
  label: string; value: string | number; hint?: string;
  icon: React.ComponentType<{ className?: string }>; accent?: string;
}) {
  return (
    <Card className="p-5 flex items-start justify-between">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold mt-2 tabular-nums">{value}</div>
        {hint && <div className={cn("text-xs mt-1", accent ?? "text-muted-foreground")}>{hint}</div>}
      </div>
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-md">
      {message}
    </div>
  );
}

interface Props { items: InventoryItem[] }

export default function InventoryDashboards({ items }: Props) {
  const hub = useInventoryHub();
  const [trendKey, setTrendKey] = useState<"collection" | "sku">("collection");

  // ===== Top KPIs =====
  const totals = useMemo(() => {
    let value = 0, units = 0, monthlySales = 0, closeoutVal = 0, discontinuedVal = 0;
    let lostUnits = 0;
    for (const it of items) {
      const cost = it.unitCost ?? 0;
      const lineVal = cost * it.onHand;
      value += lineVal;
      units += it.onHand;
      monthlySales += it.avgMonthlySales * (it.listPrice ?? cost);
      if (it.isCloseout) closeoutVal += lineVal;
      if (it.isDiscontinued) discontinuedVal += lineVal;
      if (it.status === "out-of-stock") lostUnits += it.avgMonthlySales;
    }
    const backlogValue = hub.openOrders.reduce((s, o) => s + Number(o.extended_value ?? 0), 0);
    const backlogUnits = hub.openOrders.reduce((s, o) => s + Number(o.qty_open ?? 0), 0);
    const annualSales = monthlySales * 12;
    const turnover = value > 0 ? annualSales / value : 0;
    const salesToInv = value > 0 ? monthlySales / value : 0;
    const lostSalesEstimate = hub.lostSales.reduce((s, e) => s + Number(e.estimated_value ?? 0), 0);
    return {
      value, units, monthlySales, closeoutVal, discontinuedVal,
      backlogValue, backlogUnits, turnover, salesToInv, lostUnits, lostSalesEstimate,
    };
  }, [items, hub.openOrders, hub.lostSales]);

  // ===== By collection =====
  const valueByCollection = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) {
      const v = (it.unitCost ?? 0) * it.onHand;
      m.set(it.collection, (m.get(it.collection) ?? 0) + v);
    }
    return Array.from(m, ([collection, value]) => ({ collection, value }))
      .sort((a, b) => b.value - a.value).slice(0, 10);
  }, [items]);

  const closeoutByCollection = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) {
      if (!it.isCloseout) continue;
      const v = (it.unitCost ?? 0) * it.onHand;
      m.set(it.collection, (m.get(it.collection) ?? 0) + v);
    }
    return Array.from(m, ([collection, value]) => ({ collection, value }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  const turnoverByCollection = useMemo(() => {
    const m = new Map<string, { value: number; sales: number }>();
    for (const it of items) {
      const e = m.get(it.collection) ?? { value: 0, sales: 0 };
      e.value += (it.unitCost ?? 0) * it.onHand;
      e.sales += it.avgMonthlySales * (it.listPrice ?? it.unitCost ?? 0) * 12;
      m.set(it.collection, e);
    }
    return Array.from(m, ([collection, v]) => ({
      collection,
      turnover: v.value > 0 ? +(v.sales / v.value).toFixed(2) : 0,
    })).sort((a, b) => b.turnover - a.turnover);
  }, [items]);

  // ===== Sales trend (from sku_sales_history) =====
  const salesTrend = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of hub.salesHistory) {
      const key = `${r.year}-${String(r.month).padStart(2, "0")}`;
      m.set(key, (m.get(key) ?? 0) + Number(r.revenue ?? 0));
    }
    return Array.from(m, ([period, revenue]) => ({ period, revenue }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [hub.salesHistory]);

  // ===== Buy now (suggested orders) =====
  const buyNow = useMemo(() => {
    return items
      .map((it) => {
        const target = (it.avgMonthlySales || 0) * 3; // 3 months target
        const need = Math.max(0, target - it.available);
        const suggested = it.moq ? Math.max(it.moq, Math.ceil(need / it.moq) * it.moq) : Math.ceil(need);
        return { ...it, suggested, need };
      })
      .filter((it) => it.need > 0 && (it.status === "critical" || it.status === "out-of-stock" || it.status === "reorder-soon"))
      .sort((a, b) => b.need - a.need)
      .slice(0, 25);
  }, [items]);

  // ===== Demand & velocity =====
  const velocity = useMemo(() => {
    return [...items]
      .map((it) => ({
        ...it,
        velocity: it.avgMonthlySales,
        cover: it.monthsSupply ?? 999,
      }))
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, 15);
  }, [items]);

  // ===== Slow movers =====
  const slowMovers = useMemo(() => {
    return [...items]
      .filter((it) => (it.monthsSupply ?? 0) >= 6 && it.onHand > 0)
      .sort((a, b) => (b.monthsSupply ?? 0) - (a.monthsSupply ?? 0))
      .slice(0, 20);
  }, [items]);

  // ===== Discontinued =====
  const discontinued = useMemo(() => items.filter((it) => it.isDiscontinued), [items]);

  // ===== Factory grouping =====
  const byFactory = useMemo(() => {
    const m = new Map<string, { suggested: number; moq: number; skus: number }>();
    for (const it of buyNow) {
      const f = it.factory ?? it.supplier ?? "—";
      const e = m.get(f) ?? { suggested: 0, moq: 0, skus: 0 };
      e.suggested += it.suggested;
      e.moq += it.moq ?? 0;
      e.skus += 1;
      m.set(f, e);
    }
    return Array.from(m, ([factory, v]) => ({ factory, ...v }));
  }, [buyNow]);

  // ===== Forecast vs reality =====
  const forecastVsReal = useMemo(() => {
    const m = new Map<string, { forecast: number; actual: number }>();
    for (const r of hub.salesHistory) {
      const key = `${r.year}-${String(r.month).padStart(2, "0")}`;
      const e = m.get(key) ?? { forecast: 0, actual: 0 };
      e.forecast += Number(r.forecast_units ?? 0);
      e.actual += Number(r.units_sold ?? 0);
      m.set(key, e);
    }
    return Array.from(m, ([period, v]) => ({ period, ...v }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [hub.salesHistory]);

  return (
    <div className="space-y-6">
      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPI label="Inventory Value" value={fmtMoney(totals.value)} hint={`${fmtNum(totals.units)} units`} icon={DollarSign} />
        <KPI label="Open Order Backlog" value={fmtMoney(totals.backlogValue)} hint={`${fmtNum(totals.backlogUnits)} units`} icon={ShoppingCart} />
        <KPI label="Sales / Inv Ratio" value={totals.salesToInv.toFixed(2)} hint="monthly" icon={Activity} />
        <KPI label="Turnover (annual)" value={totals.turnover.toFixed(2)} hint="× per year" icon={TrendingUp} />
        <KPI label="Closeout Value" value={fmtMoney(totals.closeoutVal)} icon={Tag} accent="text-warning-foreground" />
        <KPI label="Lost Sales (est.)" value={fmtMoney(totals.lostSalesEstimate)} hint={`${fmtNum(Math.round(totals.lostUnits))} units/mo at risk`} icon={AlertCircle} accent="text-destructive" />
      </div>

      <Tabs defaultValue="value" className="w-full">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="value">Value & Closeouts</TabsTrigger>
          <TabsTrigger value="turnover">Turnover & Ratios</TabsTrigger>
          <TabsTrigger value="trends">Sales Trends</TabsTrigger>
          <TabsTrigger value="buy">Buy Now</TabsTrigger>
          <TabsTrigger value="velocity">Demand & Velocity</TabsTrigger>
          <TabsTrigger value="health">Health & Slow Movers</TabsTrigger>
          <TabsTrigger value="discontinued">Discontinued</TabsTrigger>
          <TabsTrigger value="po">Purchase Orders</TabsTrigger>
          <TabsTrigger value="factory">Factory / MOQ</TabsTrigger>
          <TabsTrigger value="forecast">Forecast vs Reality</TabsTrigger>
          <TabsTrigger value="signals">Dealer Signals</TabsTrigger>
        </TabsList>

        {/* ----- Value & Closeouts ----- */}
        <TabsContent value="value" className="space-y-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold mb-3">Inventory Value by Collection (top 10)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valueByCollection} layout="vertical" margin={{ left: 4, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={fmtMoney} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis type="category" dataKey="collection" width={120} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <RTooltip formatter={(v: number) => fmtMoney(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-base font-semibold mb-3">Closeouts by Collection</h3>
            {closeoutByCollection.length === 0 ? (
              <EmptyState message="No closeout SKUs flagged yet." />
            ) : (
              <div className="space-y-2">
                {closeoutByCollection.map((c) => (
                  <div key={c.collection} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                    <span>{c.collection}</span>
                    <span className="font-mono tabular-nums">{fmtMoney(c.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ----- Turnover ----- */}
        <TabsContent value="turnover" className="space-y-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold mb-3">Turnover Ratio by Collection (annualized)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turnoverByCollection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="collection" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={0} angle={-25} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="turnover" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-base font-semibold mb-3">Inventory-to-Sales Ratio by SKU (top 20)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">SKU</th>
                    <th className="text-left px-3 py-2">Product</th>
                    <th className="text-right px-3 py-2">On Hand</th>
                    <th className="text-right px-3 py-2">Avg Mo. Sales</th>
                    <th className="text-right px-3 py-2">Inv/Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {items
                    .map((it) => ({ ...it, ratio: it.avgMonthlySales > 0 ? it.onHand / it.avgMonthlySales : 999 }))
                    .sort((a, b) => b.ratio - a.ratio)
                    .slice(0, 20)
                    .map((it) => (
                      <tr key={it.sku} className="border-t border-border">
                        <td className="px-3 py-2 font-mono">{it.sku}</td>
                        <td className="px-3 py-2">{it.product}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{it.onHand}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{it.avgMonthlySales}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{it.ratio === 999 ? "∞" : it.ratio.toFixed(1)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ----- Sales Trends ----- */}
        <TabsContent value="trends" className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Revenue Trend</h3>
              <div className="flex gap-1 text-xs">
                <button onClick={() => setTrendKey("collection")} className={cn("px-2 py-1 rounded", trendKey === "collection" ? "bg-primary text-primary-foreground" : "border border-border")}>By Collection</button>
                <button onClick={() => setTrendKey("sku")} className={cn("px-2 py-1 rounded", trendKey === "sku" ? "bg-primary text-primary-foreground" : "border border-border")}>By SKU</button>
              </div>
            </div>
            {salesTrend.length === 0 ? (
              <EmptyState message="No sales history yet — sync sku_sales_history from Acctivate." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tickFormatter={fmtMoney} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <RTooltip formatter={(v: number) => fmtMoney(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ----- Buy Now ----- */}
        <TabsContent value="buy">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Buy Now — Suggested Orders</h3>
              <Badge variant="secondary" className="ml-auto">{buyNow.length} SKUs</Badge>
            </div>
            {buyNow.length === 0 ? <EmptyState message="No SKUs need replenishment right now." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">SKU</th>
                      <th className="text-left px-3 py-2">Product</th>
                      <th className="text-left px-3 py-2">Factory</th>
                      <th className="text-right px-3 py-2">Available</th>
                      <th className="text-right px-3 py-2">Avg Mo.</th>
                      <th className="text-right px-3 py-2">Need</th>
                      <th className="text-right px-3 py-2">MOQ</th>
                      <th className="text-right px-3 py-2">Suggested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyNow.map((it) => (
                      <tr key={it.sku} className="border-t border-border">
                        <td className="px-3 py-2 font-mono">{it.sku}</td>
                        <td className="px-3 py-2">{it.product}</td>
                        <td className="px-3 py-2 text-muted-foreground">{it.factory ?? it.supplier}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{it.available}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{it.avgMonthlySales}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-destructive font-semibold">{Math.ceil(it.need)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{it.moq ?? "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{it.suggested}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ----- Velocity ----- */}
        <TabsContent value="velocity">
          <Card className="p-5">
            <h3 className="text-base font-semibold mb-3">Demand & Velocity (top 15 movers)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="sku" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={0} angle={-30} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="velocity" fill="hsl(var(--primary))" name="Avg Monthly Sales" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        {/* ----- Health & Slow ----- */}
        <TabsContent value="health" className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-warning-foreground" />
              <h3 className="text-base font-semibold">Slow Movers (≥6 months supply)</h3>
            </div>
            {slowMovers.length === 0 ? <EmptyState message="No slow movers — looking healthy." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">SKU</th>
                      <th className="text-left px-3 py-2">Product</th>
                      <th className="text-left px-3 py-2">Collection</th>
                      <th className="text-right px-3 py-2">On Hand</th>
                      <th className="text-right px-3 py-2">Mo. Supply</th>
                      <th className="text-right px-3 py-2">Tied-up Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowMovers.map((it) => (
                      <tr key={it.sku} className="border-t border-border">
                        <td className="px-3 py-2 font-mono">{it.sku}</td>
                        <td className="px-3 py-2">{it.product}</td>
                        <td className="px-3 py-2">{it.collection}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{it.onHand}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{(it.monthsSupply ?? 0).toFixed(1)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtMoney((it.unitCost ?? 0) * it.onHand)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ----- Discontinued ----- */}
        <TabsContent value="discontinued">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Archive className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-semibold">Discontinued Inventory</h3>
              <Badge variant="secondary" className="ml-auto">{discontinued.length} SKUs · {fmtMoney(totals.discontinuedVal)}</Badge>
            </div>
            {discontinued.length === 0 ? <EmptyState message="No discontinued SKUs flagged." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">SKU</th>
                      <th className="text-left px-3 py-2">Product</th>
                      <th className="text-right px-3 py-2">On Hand</th>
                      <th className="text-right px-3 py-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discontinued.map((it) => (
                      <tr key={it.sku} className="border-t border-border">
                        <td className="px-3 py-2 font-mono">{it.sku}</td>
                        <td className="px-3 py-2">{it.product}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{it.onHand}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtMoney((it.unitCost ?? 0) * it.onHand)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ----- POs ----- */}
        <TabsContent value="po" className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Open Purchase Orders</h3>
            </div>
            {hub.purchaseOrders.length === 0 ? <EmptyState message="No open POs synced yet." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">PO #</th>
                      <th className="text-left px-3 py-2">Factory</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-left px-3 py-2">ETA</th>
                      <th className="text-right px-3 py-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hub.purchaseOrders.map((po) => (
                      <tr key={po.id} className="border-t border-border">
                        <td className="px-3 py-2 font-mono">{po.po_number ?? "—"}</td>
                        <td className="px-3 py-2">{po.factory ?? "—"}</td>
                        <td className="px-3 py-2">{po.status ?? "—"}</td>
                        <td className="px-3 py-2">{po.eta ?? "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(Number(po.total_value))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <PackageOpen className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Incoming Inventory (line items)</h3>
            </div>
            {hub.poLines.length === 0 ? <EmptyState message="No incoming PO lines yet." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">SKU</th>
                      <th className="text-right px-3 py-2">Ordered</th>
                      <th className="text-right px-3 py-2">Received</th>
                      <th className="text-right px-3 py-2">Open</th>
                      <th className="text-left px-3 py-2">ETA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hub.poLines.map((l) => (
                      <tr key={l.id} className="border-t border-border">
                        <td className="px-3 py-2 font-mono">{l.sku}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{l.qty_ordered}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{l.qty_received}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{Number(l.qty_ordered) - Number(l.qty_received)}</td>
                        <td className="px-3 py-2">{l.eta ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ----- Factory MOQ ----- */}
        <TabsContent value="factory">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Factory className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">SKUs Grouped by Factory — Suggested vs MOQ</h3>
            </div>
            {byFactory.length === 0 ? <EmptyState message="Nothing to order right now." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">Factory</th>
                      <th className="text-right px-3 py-2">SKUs</th>
                      <th className="text-right px-3 py-2">Total MOQ</th>
                      <th className="text-right px-3 py-2">Suggested Order</th>
                      <th className="text-right px-3 py-2">vs MOQ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byFactory.map((f) => (
                      <tr key={f.factory} className="border-t border-border">
                        <td className="px-3 py-2">{f.factory}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{f.skus}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{f.moq}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{f.suggested}</td>
                        <td className={cn("px-3 py-2 text-right tabular-nums", f.suggested >= f.moq ? "text-success" : "text-warning-foreground")}>
                          {f.moq > 0 ? `${Math.round((f.suggested / f.moq) * 100)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ----- Forecast vs reality ----- */}
        <TabsContent value="forecast">
          <Card className="p-5">
            <h3 className="text-base font-semibold mb-3">Forecast vs Actual</h3>
            {forecastVsReal.length === 0 ? <EmptyState message="No forecast data yet — populate sku_sales_history.forecast_units." /> : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastVsReal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="forecast" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Forecast" />
                    <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Actual" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ----- Dealer signals ----- */}
        <TabsContent value="signals">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Dealer Demand Signals</h3>
            </div>
            {hub.demandSignals.length === 0 ? <EmptyState message="No dealer demand signals yet — capture quote requests, inquiries, or wishlist hits to populate." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">Date</th>
                      <th className="text-left px-3 py-2">SKU</th>
                      <th className="text-left px-3 py-2">Dealer</th>
                      <th className="text-left px-3 py-2">Type</th>
                      <th className="text-right px-3 py-2">Strength</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hub.demandSignals.map((s) => (
                      <tr key={s.id} className="border-t border-border">
                        <td className="px-3 py-2">{s.signal_date}</td>
                        <td className="px-3 py-2 font-mono">{s.sku}</td>
                        <td className="px-3 py-2">{s.dealer_name ?? "—"}</td>
                        <td className="px-3 py-2">{s.signal_type}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{s.signal_strength}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
