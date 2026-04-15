import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import { FilterBar } from "@/components/FilterBar";
import { StatusBadge } from "@/components/StatusBadge";
import { KpiGauge } from "@/components/KpiGauge";
import { useSalesReps, useTerritories, useDealers, useRepTerritories, formatCurrency, getInitials, getTerritoryName, getDealersByRep } from "@/hooks/usePortalData";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

export default function SalesRepsPage() {
  const { data: reps = [], isLoading: repsLoading } = useSalesReps();
  const { data: territories = [] } = useTerritories();
  const { data: dealers = [] } = useDealers();
  const { data: repTerritories = [] } = useRepTerritories();

  const [search, setSearch] = useState("");
  const [territoryFilter, setTerritoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRep, setSelectedRep] = useState<string | null>(null);

  const filtered = reps.filter(r => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (territoryFilter !== "all") {
      const repTerIds = repTerritories.filter(rt => rt.rep_id === r.id).map(rt => rt.territory_id);
      if (!repTerIds.includes(territoryFilter)) return false;
    }
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  }).sort((a, b) => (b.kpi_score ?? 0) - (a.kpi_score ?? 0));

  const rep = reps.find(r => r.id === selectedRep);
  const repTerIds = rep ? repTerritories.filter(rt => rt.rep_id === rep.id).map(rt => rt.territory_id) : [];
  const repDealers = rep ? getDealersByRep(dealers, rep.id) : [];

  if (repsLoading) {
    return (
      <div className="animate-fade-in space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Sales Reps</h1>
        <p className="page-subtitle">{reps.length} reps synced from Acctivate</p>
      </div>

      <FilterBar
        searchPlaceholder="Search reps..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          { label: "Territory", value: territoryFilter, onChange: setTerritoryFilter, options: territories.map(t => ({ label: t.name, value: t.id })) },
          { label: "Status", value: statusFilter, onChange: setStatusFilter, options: [{ label: 'Active', value: 'active' }, { label: 'On Leave', value: 'on-leave' }, { label: 'Inactive', value: 'inactive' }] },
        ]}
      />

      <div className="table-container">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-medium text-muted-foreground">Rep</th>
              <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Territories</th>
              <th className="text-center p-3 font-medium text-muted-foreground">Dealers</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 font-medium text-muted-foreground">KPI</th>
              <th className="text-right p-3 font-medium text-muted-foreground hidden lg:table-cell">Revenue</th>
              <th className="text-right p-3 font-medium text-muted-foreground hidden lg:table-cell">Quota %</th>
              <th className="text-center p-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const rTerIds = repTerritories.filter(rt => rt.rep_id === r.id).map(rt => rt.territory_id);
              const dealerCount = dealers.filter(d => d.rep_id === r.id).length;
              const quotaPct = (r.quota ?? 0) > 0 ? Math.round((r.revenue ?? 0) / (r.quota ?? 1) * 100) : 0;
              return (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedRep(r.id)}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[11px] font-semibold text-primary-foreground shrink-0">
                        {getInitials(r.name)}
                      </div>
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {rTerIds.length > 0 ? rTerIds.map(tId => (
                        <span key={tId} className="text-[11px] bg-muted px-2 py-0.5 rounded-full">{getTerritoryName(territories, tId)}</span>
                      )) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center">{dealerCount}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="p-3"><KpiGauge score={r.kpi_score ?? 0} size="sm" /></td>
                  <td className="p-3 text-right hidden lg:table-cell font-medium">{formatCurrency(r.revenue)}</td>
                  <td className="p-3 text-right hidden lg:table-cell">{quotaPct > 0 ? `${quotaPct}%` : '—'}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      {r.email && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); window.location.href = `mailto:${r.email}`; }}>
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {r.phone && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); window.location.href = `tel:${r.phone}`; }}>
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">No reps match your filters.</p>}
      </div>

      <Sheet open={!!selectedRep} onOpenChange={() => setSelectedRep(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {rep && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                    {getInitials(rep.name)}
                  </div>
                  <div>
                    <SheetTitle>{rep.name}</SheetTitle>
                    <p className="text-xs text-muted-foreground">{rep.email || 'No email'} {rep.phone ? `• ${rep.phone}` : ''}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-3">
                  <StatusBadge status={rep.status} />
                  <KpiGauge score={rep.kpi_score ?? 0} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="stat-card"><p className="text-[11px] text-muted-foreground uppercase">Revenue</p><p className="text-lg font-semibold">{formatCurrency(rep.revenue)}</p></div>
                  <div className="stat-card"><p className="text-[11px] text-muted-foreground uppercase">Quota</p><p className="text-lg font-semibold">{formatCurrency(rep.quota)}</p></div>
                  <div className="stat-card"><p className="text-[11px] text-muted-foreground uppercase">Tasks Done</p><p className="text-lg font-semibold">{rep.tasks_completed ?? 0}</p></div>
                  <div className="stat-card"><p className="text-[11px] text-muted-foreground uppercase">Overdue</p><p className="text-lg font-semibold text-destructive">{rep.tasks_overdue ?? 0}</p></div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Territories</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {repTerIds.length > 0 ? repTerIds.map(tId => <span key={tId} className="text-xs bg-muted px-3 py-1 rounded-full">{getTerritoryName(territories, tId)}</span>) : (
                      <span className="text-xs text-muted-foreground">No territories assigned yet</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Assigned Dealers ({repDealers.length})</h4>
                  <div className="space-y-2">
                    {repDealers.length > 0 ? repDealers.map(d => (
                      <div key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-sm">
                        <span>{d.name}</span>
                        <StatusBadge status={d.engagement ?? 'medium'} />
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground">No dealers assigned yet</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Notes</h4>
                  <div className="rounded-lg border border-border p-3 min-h-[80px] text-sm text-muted-foreground">No notes yet.</div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
