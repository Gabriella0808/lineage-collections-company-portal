import { useState } from "react";
import { Mail, Phone, Eye, ExternalLink } from "lucide-react";
import { FilterBar } from "@/components/FilterBar";
import { StatusBadge } from "@/components/StatusBadge";
import { KpiGauge } from "@/components/KpiGauge";
import { salesReps, territories, dealers, getTerritoryName, getDealersByRep, formatCurrency, monthlyKpi, activities } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function SalesRepsPage() {
  const [search, setSearch] = useState("");
  const [territoryFilter, setTerritoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRep, setSelectedRep] = useState<string | null>(null);

  const filtered = salesReps.filter(r => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (territoryFilter !== "all" && !r.territories.includes(territoryFilter)) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  }).sort((a, b) => b.kpiScore - a.kpiScore);

  const rep = salesReps.find(r => r.id === selectedRep);
  const repKpi = rep ? monthlyKpi.filter(k => k.repId === rep.id) : [];
  const repDealers = rep ? getDealersByRep(rep.id) : [];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Sales Reps</h1>
        <p className="page-subtitle">{salesReps.length} reps assigned to your region</p>
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
            {filtered.map(r => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedRep(r.id)}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[11px] font-semibold text-primary-foreground shrink-0">
                      {r.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {r.territories.map(t => (
                      <span key={t} className="text-[11px] bg-muted px-2 py-0.5 rounded-full">{getTerritoryName(t)}</span>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-center">{r.dealerCount}</td>
                <td className="p-3"><StatusBadge status={r.status} /></td>
                <td className="p-3"><KpiGauge score={r.kpiScore} size="sm" /></td>
                <td className="p-3 text-right hidden lg:table-cell font-medium">{formatCurrency(r.revenue)}</td>
                <td className="p-3 text-right hidden lg:table-cell">{Math.round(r.revenue / r.quota * 100)}%</td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); window.location.href = `mailto:${r.email}`; }}>
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); window.location.href = `tel:${r.phone}`; }}>
                      <Phone className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">No reps match your filters.</p>}
      </div>

      {/* Rep Detail Sheet */}
      <Sheet open={!!selectedRep} onOpenChange={() => setSelectedRep(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {rep && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                    {rep.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <SheetTitle>{rep.name}</SheetTitle>
                    <p className="text-xs text-muted-foreground">{rep.email} • {rep.phone}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-3">
                  <StatusBadge status={rep.status} />
                  <KpiGauge score={rep.kpiScore} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="stat-card"><p className="text-[11px] text-muted-foreground uppercase">Revenue</p><p className="text-lg font-semibold">{formatCurrency(rep.revenue)}</p></div>
                  <div className="stat-card"><p className="text-[11px] text-muted-foreground uppercase">Quota</p><p className="text-lg font-semibold">{formatCurrency(rep.quota)}</p></div>
                  <div className="stat-card"><p className="text-[11px] text-muted-foreground uppercase">Tasks Done</p><p className="text-lg font-semibold">{rep.tasksCompleted}</p></div>
                  <div className="stat-card"><p className="text-[11px] text-muted-foreground uppercase">Overdue</p><p className="text-lg font-semibold text-destructive">{rep.tasksOverdue}</p></div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Territories</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {rep.territories.map(t => <span key={t} className="text-xs bg-muted px-3 py-1 rounded-full">{getTerritoryName(t)}</span>)}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Monthly Revenue ($K)</h4>
                  <div className="h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={repKpi.map(k => ({ month: k.month, revenue: k.revenue / 1000, quota: k.quota / 1000 }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 90%)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="hsl(220 35% 22%)" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="quota" fill="hsl(38 75% 50%)" radius={[3, 3, 0, 0]} opacity={0.4} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Assigned Dealers ({repDealers.length})</h4>
                  <div className="space-y-2">
                    {repDealers.map(d => (
                      <div key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-sm">
                        <span>{d.name}</span>
                        <StatusBadge status={d.engagement} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Notes</h4>
                  <div className="rounded-lg border border-border p-3 min-h-[80px] text-sm text-muted-foreground">No notes yet. Notes will appear here.</div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
