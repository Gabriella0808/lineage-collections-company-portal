import { useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import { StatusBadge } from "@/components/StatusBadge";
import { KpiGauge } from "@/components/KpiGauge";
import { useSalesReps, useTerritories, useDealers, useRepTerritories, formatCurrency, getInitials, getRepsByTerritory, getDealersByTerritory } from "@/hooks/usePortalData";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

export default function TerritoriesPage() {
  const { data: reps = [] } = useSalesReps();
  const { data: territories = [], isLoading } = useTerritories();
  const { data: dealers = [] } = useDealers();
  const { data: repTerritories = [] } = useRepTerritories();

  const [search, setSearch] = useState("");
  const [repFilter, setRepFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = territories.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (repFilter !== "all") {
      const terRepIds = repTerritories.filter(rt => rt.territory_id === t.id).map(rt => rt.rep_id);
      if (!terRepIds.includes(repFilter)) return false;
    }
    return true;
  }).sort((a, b) => (b.kpi_score ?? 0) - (a.kpi_score ?? 0));

  const ter = territories.find(t => t.id === selected);
  const terReps = ter ? getRepsByTerritory(reps, repTerritories, ter.id) : [];
  const terDealers = ter ? getDealersByTerritory(dealers, ter.id) : [];

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Territories</h1>
        <p className="page-subtitle">{territories.length} territories synced</p>
      </div>

      <FilterBar
        searchPlaceholder="Search territories..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          { label: "Rep", value: repFilter, onChange: setRepFilter, options: reps.map(r => ({ label: r.name, value: r.id })) },
        ]}
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(t => {
          const tReps = getRepsByTerritory(reps, repTerritories, t.id);
          const tDealers = getDealersByTerritory(dealers, t.id);
          return (
            <div key={t.id} className="stat-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(t.id)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-xs text-muted-foreground">{t.region || 'No region'} • {t.state || '—'}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div><p className="text-[11px] text-muted-foreground">Revenue</p><p className="text-sm font-semibold">{formatCurrency(t.revenue)}</p></div>
                <div><p className="text-[11px] text-muted-foreground">Quota</p><p className="text-sm font-semibold">{formatCurrency(t.quota)}</p></div>
                <div><p className="text-[11px] text-muted-foreground">Dealers</p><p className="text-sm font-semibold">{tDealers.length}</p></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-1">
                  {tReps.map(r => (
                    <div key={r.id} className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center border-2 border-card">
                      {getInitials(r.name)}
                    </div>
                  ))}
                </div>
                <KpiGauge score={t.kpi_score ?? 0} size="sm" />
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">No territories match your filters.</p>}

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {ter && (
            <>
              <SheetHeader>
                <SheetTitle>{ter.name}</SheetTitle>
                <p className="text-xs text-muted-foreground">{ter.region || 'No region'} • {ter.state || '—'}</p>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-3">
                  <StatusBadge status={ter.status} />
                  <KpiGauge score={ter.kpi_score ?? 0} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="stat-card"><p className="text-[11px] text-muted-foreground uppercase">Revenue</p><p className="text-lg font-semibold">{formatCurrency(ter.revenue)}</p></div>
                  <div className="stat-card"><p className="text-[11px] text-muted-foreground uppercase">Quota</p><p className="text-lg font-semibold">{formatCurrency(ter.quota)}</p></div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Assigned Reps ({terReps.length})</h4>
                  <div className="space-y-2">
                    {terReps.length > 0 ? terReps.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-semibold text-primary-foreground">
                            {getInitials(r.name)}
                          </div>
                          <span>{r.name}</span>
                        </div>
                        <KpiGauge score={r.kpi_score ?? 0} size="sm" />
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground">No reps assigned yet</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Dealers ({terDealers.length})</h4>
                  <div className="space-y-2">
                    {terDealers.length > 0 ? terDealers.map(d => (
                      <div key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-sm">
                        <div>
                          <p className="font-medium">{d.name}</p>
                          <p className="text-[11px] text-muted-foreground">{d.city || ''}{d.city && d.state ? ', ' : ''}{d.state || ''}</p>
                        </div>
                        <StatusBadge status={d.status} />
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground">No dealers assigned yet</p>
                    )}
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
