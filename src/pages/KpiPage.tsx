import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { KpiGauge } from "@/components/KpiGauge";
import { StatusBadge } from "@/components/StatusBadge";
import { useSalesReps, useTerritories, useDealers, useRepTerritories, formatCurrency, formatPercent, getInitials } from "@/hooks/usePortalData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingUp, Users, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function KpiPage() {
  const { data: reps = [], isLoading: repsLoading } = useSalesReps();
  const { data: territories = [] } = useTerritories();
  const { data: dealers = [] } = useDealers();
  const { data: repTerritories = [] } = useRepTerritories();

  const [tab, setTab] = useState<'overview' | 'reps' | 'territories'>('overview');

  const avgKpi = reps.length > 0 ? Math.round(reps.reduce((s, r) => s + (r.kpi_score ?? 0), 0) / reps.length) : 0;
  const totalRevenue = reps.reduce((s, r) => s + (r.revenue ?? 0), 0);
  const totalQuota = reps.reduce((s, r) => s + (r.quota ?? 0), 0);
  const totalOverdue = reps.reduce((s, r) => s + (r.tasks_overdue ?? 0), 0);
  const totalTasks = reps.reduce((s, r) => s + (r.tasks_completed ?? 0) + (r.tasks_pending ?? 0) + (r.tasks_overdue ?? 0), 0);
  const completionRate = totalTasks > 0 ? reps.reduce((s, r) => s + (r.tasks_completed ?? 0), 0) / totalTasks : 0;

  const repRanking = [...reps].sort((a, b) => (b.kpi_score ?? 0) - (a.kpi_score ?? 0));
  const territoryRanking = [...territories].sort((a, b) => (b.kpi_score ?? 0) - (a.kpi_score ?? 0));

  const dealerCoverage = territories.map(t => ({
    name: t.name.length > 14 ? t.name.slice(0, 14) + '…' : t.name,
    dealers: dealers.filter(d => d.territory_id === t.id).length,
    coverage: (t.quota ?? 0) > 0 ? Math.round((t.revenue ?? 0) / (t.quota ?? 1) * 100) : 0,
  }));

  if (repsLoading) {
    return (
      <div className="animate-fade-in space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">KPI Performance</h1>
        <p className="page-subtitle">Track rep, territory, and dealer performance metrics</p>
      </div>

      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg w-fit">
        {(['overview', 'reps', 'territories'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard title="Avg KPI Score" value={avgKpi} icon={Target} trend={avgKpi >= 80 ? 'up' : 'neutral'} trendValue="team avg" variant="accent" />
            <StatCard title="Quota Attainment" value={totalQuota > 0 ? `${Math.round(totalRevenue / totalQuota * 100)}%` : '—'} icon={TrendingUp} trend="neutral" trendValue={formatCurrency(totalRevenue)} />
            <StatCard title="Task Completion" value={formatPercent(completionRate)} trend={completionRate >= 0.8 ? 'up' : 'neutral'} trendValue={`${totalOverdue} overdue`} variant={totalOverdue > 10 ? 'warning' : 'success'} />
            <StatCard title="Active Dealers" value={dealers.filter(d => d.status === 'active').length} icon={Users} subtitle={`of ${dealers.length} total`} />
          </div>

          <div className="glass-card p-5 mb-6">
            <h3 className="text-sm font-semibold mb-4">Dealer Coverage by Territory</h3>
            <div className="h-[260px]">
              {dealerCoverage.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dealerCoverage} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 90%)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="coverage" fill="hsl(152 60% 40%)" radius={[0, 4, 4, 0]} name="Coverage %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center pt-20">No territory data yet.</p>
              )}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Exception Areas</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {repRanking.filter(r => (r.kpi_score ?? 0) < 75 && (r.kpi_score ?? 0) > 0).map(r => (
                <div key={r.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{r.name}</p>
                    <KpiGauge score={r.kpi_score ?? 0} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">{r.tasks_overdue ?? 0} overdue • {(r.quota ?? 0) > 0 ? `${Math.round((r.revenue ?? 0) / (r.quota ?? 1) * 100)}% quota` : 'No quota set'}</p>
                </div>
              ))}
              {territoryRanking.filter(t => (t.kpi_score ?? 0) < 75 && (t.kpi_score ?? 0) > 0).map(t => (
                <div key={t.id} className="p-3 rounded-lg bg-warning/5 border border-warning/10">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{t.name}</p>
                    <KpiGauge score={t.kpi_score ?? 0} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t.status} • {formatCurrency((t.quota ?? 0) - (t.revenue ?? 0))} gap</p>
                </div>
              ))}
              {repRanking.filter(r => (r.kpi_score ?? 0) < 75 && (r.kpi_score ?? 0) > 0).length === 0 && territoryRanking.filter(t => (t.kpi_score ?? 0) < 75 && (t.kpi_score ?? 0) > 0).length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full">No KPI data to flag yet — scores will appear after data is synced.</p>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'reps' && (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-center p-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Rep</th>
                <th className="text-left p-3 font-medium text-muted-foreground">KPI</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Revenue</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Quota %</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Tasks Done</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Overdue</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Dealers</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {repRanking.map((r, i) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-3 text-center text-muted-foreground font-medium">{i + 1}</td>
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3"><KpiGauge score={r.kpi_score ?? 0} size="sm" /></td>
                  <td className="p-3 text-right font-medium">{formatCurrency(r.revenue)}</td>
                  <td className="p-3 text-right">{(r.quota ?? 0) > 0 ? `${Math.round((r.revenue ?? 0) / (r.quota ?? 1) * 100)}%` : '—'}</td>
                  <td className="p-3 text-center">{r.tasks_completed ?? 0}</td>
                  <td className="p-3 text-center">{(r.tasks_overdue ?? 0) > 0 ? <span className="text-destructive font-semibold">{r.tasks_overdue}</span> : '0'}</td>
                  <td className="p-3 text-center">{dealers.filter(d => d.rep_id === r.id).length}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'territories' && (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-center p-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Territory</th>
                <th className="text-left p-3 font-medium text-muted-foreground">KPI</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Revenue</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Quota %</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Dealers</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Reps</th>
              </tr>
            </thead>
            <tbody>
              {territoryRanking.map((t, i) => {
                const tRepIds = repTerritories.filter(rt => rt.territory_id === t.id).map(rt => rt.rep_id);
                return (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3 text-center text-muted-foreground font-medium">{i + 1}</td>
                    <td className="p-3 font-medium">{t.name}</td>
                    <td className="p-3"><KpiGauge score={t.kpi_score ?? 0} size="sm" /></td>
                    <td className="p-3 text-right font-medium">{formatCurrency(t.revenue)}</td>
                    <td className="p-3 text-right">{(t.quota ?? 0) > 0 ? `${Math.round((t.revenue ?? 0) / (t.quota ?? 1) * 100)}%` : '—'}</td>
                    <td className="p-3 text-center">{dealers.filter(d => d.territory_id === t.id).length}</td>
                    <td className="p-3"><StatusBadge status={t.status} /></td>
                    <td className="p-3">
                      <div className="flex -space-x-1">
                        {tRepIds.map(rId => {
                          const r = reps.find(s => s.id === rId);
                          return r ? <div key={rId} className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center border-2 border-card">{getInitials(r.name)}</div> : null;
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
