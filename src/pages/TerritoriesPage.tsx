import { useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import { StatusBadge } from "@/components/StatusBadge";
import { KpiGauge } from "@/components/KpiGauge";
import { territories, salesReps, dealers, getRepsByTerritory, getDealersByTerritory, formatCurrency } from "@/data/mockData";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TerritoriesPage() {
  const [search, setSearch] = useState("");
  const [repFilter, setRepFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = territories.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (repFilter !== "all" && !t.assignedReps.includes(repFilter)) return false;
    return true;
  }).sort((a, b) => b.kpiScore - a.kpiScore);

  const ter = territories.find(t => t.id === selected);
  const terReps = ter ? getRepsByTerritory(ter.id) : [];
  const terDealers = ter ? getDealersByTerritory(ter.id) : [];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Territories</h1>
        <p className="page-subtitle">{territories.length} territories under management</p>
      </div>

      <FilterBar
        searchPlaceholder="Search territories..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          { label: "Rep", value: repFilter, onChange: setRepFilter, options: salesReps.map(r => ({ label: r.name, value: r.id })) },
        ]}
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(t => (
          <div key={t.id} className="stat-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(t.id)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{t.name}</h3>
                <p className="text-xs text-muted-foreground">{t.region} • {t.state}</p>
              </div>
              <StatusBadge status={t.status} />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div><p className="text-[11px] text-muted-foreground">Revenue</p><p className="text-sm font-semibold">{formatCurrency(t.revenue)}</p></div>
              <div><p className="text-[11px] text-muted-foreground">Quota</p><p className="text-sm font-semibold">{formatCurrency(t.quota)}</p></div>
              <div><p className="text-[11px] text-muted-foreground">Dealers</p><p className="text-sm font-semibold">{t.dealerCount}</p></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-1">
                {getRepsByTerritory(t.id).map(r => (
                  <div key={r.id} className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center border-2 border-card">
                    {r.name.split(' ').map(n => n[0]).join('')}
                  </div>
                ))}
              </div>
              <KpiGauge score={t.kpiScore} size="sm" />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">No territories match your filters.</p>}

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {ter && (
            <>
              <SheetHeader>
                <SheetTitle>{ter.name}</SheetTitle>
                <p className="text-xs text-muted-foreground">{ter.region} • {ter.state}</p>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-3">
                  <StatusBadge status={ter.status} />
                  <KpiGauge score={ter.kpiScore} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="stat-card"><p className="text-[11px] text-muted-foreground uppercase">Revenue</p><p className="text-lg font-semibold">{formatCurrency(ter.revenue)}</p></div>
                  <div className="stat-card"><p className="text-[11px] text-muted-foreground uppercase">Quota</p><p className="text-lg font-semibold">{formatCurrency(ter.quota)}</p></div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Assigned Reps ({terReps.length})</h4>
                  <div className="space-y-2">
                    {terReps.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-semibold text-primary-foreground">
                            {r.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span>{r.name}</span>
                        </div>
                        <KpiGauge score={r.kpiScore} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Dealers ({terDealers.length})</h4>
                  <div className="space-y-2">
                    {terDealers.map(d => (
                      <div key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-sm">
                        <div>
                          <p className="font-medium">{d.name}</p>
                          <p className="text-[11px] text-muted-foreground">{d.city}, {d.state}</p>
                        </div>
                        <StatusBadge status={d.status} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Rep Revenue in Territory ($K)</h4>
                  <div className="h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={terReps.map(r => ({ name: r.name.split(' ')[1], revenue: r.revenue / 1000 }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 90%)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="hsl(220 35% 22%)" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
