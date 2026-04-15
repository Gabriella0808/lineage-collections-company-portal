import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { KpiGauge } from "@/components/KpiGauge";
import { StatusBadge } from "@/components/StatusBadge";
import { FilterBar } from "@/components/FilterBar";
import { salesReps, territories, dealers, monthlyKpi, formatCurrency, formatPercent, getTerritoryName } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { AlertTriangle, TrendingUp, Users, Target } from "lucide-react";

const avgKpi = Math.round(salesReps.reduce((s, r) => s + r.kpiScore, 0) / salesReps.length);
const totalRevenue = salesReps.reduce((s, r) => s + r.revenue, 0);
const totalQuota = salesReps.reduce((s, r) => s + r.quota, 0);
const totalOverdue = salesReps.reduce((s, r) => s + r.tasksOverdue, 0);
const totalTasks = salesReps.reduce((s, r) => s + r.tasksCompleted + r.tasksPending + r.tasksOverdue, 0);
const completionRate = salesReps.reduce((s, r) => s + r.tasksCompleted, 0) / totalTasks;

const repRanking = [...salesReps].sort((a, b) => b.kpiScore - a.kpiScore);
const territoryRanking = [...territories].sort((a, b) => b.kpiScore - a.kpiScore);

// Monthly trend for all reps combined
const months = ['Jan', 'Feb', 'Mar', 'Apr'];
const trendData = months.map(m => {
  const records = monthlyKpi.filter(k => k.month === m);
  return {
    month: m,
    revenue: records.reduce((s, r) => s + r.revenue, 0) / 1000,
    quota: records.reduce((s, r) => s + r.quota, 0) / 1000,
    visits: records.reduce((s, r) => s + r.dealerVisits, 0),
  };
});

const dealerCoverage = territories.map(t => ({
  name: t.name.length > 14 ? t.name.slice(0, 14) + '…' : t.name,
  dealers: t.dealerCount,
  coverage: Math.round(t.revenue / t.quota * 100),
}));

export default function KpiPage() {
  const [tab, setTab] = useState<'overview' | 'reps' | 'territories'>('overview');

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">KPI Performance</h1>
        <p className="page-subtitle">Track rep, territory, and dealer performance metrics</p>
      </div>

      {/* Tab buttons */}
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
            <StatCard title="Avg KPI Score" value={avgKpi} icon={Target} trend={avgKpi >= 80 ? 'up' : 'down'} trendValue="team avg" variant="accent" />
            <StatCard title="Quota Attainment" value={`${Math.round(totalRevenue / totalQuota * 100)}%`} icon={TrendingUp} trend="up" trendValue={formatCurrency(totalRevenue)} />
            <StatCard title="Task Completion" value={formatPercent(completionRate)} trend={completionRate >= 0.8 ? 'up' : 'down'} trendValue={`${totalOverdue} overdue`} variant={totalOverdue > 10 ? 'warning' : 'success'} />
            <StatCard title="Active Dealers" value={dealers.filter(d => d.status === 'active').length} icon={Users} subtitle={`of ${dealers.length} total`} />
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mb-6">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-4">Revenue Trend ($K)</h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(220 35% 22%)" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="quota" stroke="hsl(38 75% 50%)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-4">Dealer Coverage by Territory</h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dealerCoverage} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 90%)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="coverage" fill="hsl(152 60% 40%)" radius={[0, 4, 4, 0]} name="Coverage %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Exceptions */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Exception Areas</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {repRanking.filter(r => r.kpiScore < 75).map(r => (
                <div key={r.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{r.name}</p>
                    <KpiGauge score={r.kpiScore} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">{r.tasksOverdue} overdue tasks • {Math.round(r.revenue / r.quota * 100)}% quota</p>
                </div>
              ))}
              {territoryRanking.filter(t => t.kpiScore < 75).map(t => (
                <div key={t.id} className="p-3 rounded-lg bg-warning/5 border border-warning/10">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{t.name}</p>
                    <KpiGauge score={t.kpiScore} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t.status} • {formatCurrency(t.quota - t.revenue)} gap</p>
                </div>
              ))}
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
                  <td className="p-3"><KpiGauge score={r.kpiScore} size="sm" /></td>
                  <td className="p-3 text-right font-medium">{formatCurrency(r.revenue)}</td>
                  <td className="p-3 text-right">{Math.round(r.revenue / r.quota * 100)}%</td>
                  <td className="p-3 text-center">{r.tasksCompleted}</td>
                  <td className="p-3 text-center">{r.tasksOverdue > 0 ? <span className="text-destructive font-semibold">{r.tasksOverdue}</span> : '0'}</td>
                  <td className="p-3 text-center">{r.dealerCount}</td>
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
              {territoryRanking.map((t, i) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-3 text-center text-muted-foreground font-medium">{i + 1}</td>
                  <td className="p-3 font-medium">{t.name}</td>
                  <td className="p-3"><KpiGauge score={t.kpiScore} size="sm" /></td>
                  <td className="p-3 text-right font-medium">{formatCurrency(t.revenue)}</td>
                  <td className="p-3 text-right">{Math.round(t.revenue / t.quota * 100)}%</td>
                  <td className="p-3 text-center">{t.dealerCount}</td>
                  <td className="p-3"><StatusBadge status={t.status} /></td>
                  <td className="p-3">
                    <div className="flex -space-x-1">
                      {t.assignedReps.map(rId => {
                        const r = salesReps.find(s => s.id === rId);
                        return r ? <div key={rId} className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center border-2 border-card">{r.name.split(' ').map(n => n[0]).join('')}</div> : null;
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
