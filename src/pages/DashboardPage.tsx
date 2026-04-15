import { Users, Map, Store, AlertTriangle, CheckCircle, Clock, TrendingUp, Mail, Phone, ExternalLink } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { KpiGauge } from "@/components/KpiGauge";
import { useSalesReps, useTerritories, useDealers, useActivities, useRepTerritories, formatCurrency, getInitials } from "@/hooks/usePortalData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: reps = [], isLoading: repsLoading } = useSalesReps();
  const { data: territories = [], isLoading: terLoading } = useTerritories();
  const { data: dealers = [], isLoading: dlrLoading } = useDealers();
  const { data: activities = [] } = useActivities();
  const { data: repTerritories = [] } = useRepTerritories();

  const isLoading = repsLoading || terLoading || dlrLoading;

  const totalOverdue = reps.reduce((s, r) => s + (r.tasks_overdue ?? 0), 0);
  const totalPending = reps.reduce((s, r) => s + (r.tasks_pending ?? 0), 0);
  const totalRevenue = reps.reduce((s, r) => s + (r.revenue ?? 0), 0);
  const totalQuota = reps.reduce((s, r) => s + (r.quota ?? 0), 0);

  const repChartData = reps.slice(0, 12).map(r => ({
    name: r.name.split(' ').pop() || r.name,
    revenue: (r.revenue ?? 0) / 1000,
    quota: (r.quota ?? 0) / 1000,
  }));

  const territoryChartData = territories.map(t => ({
    name: t.name.length > 12 ? t.name.slice(0, 12) + '…' : t.name,
    kpi: t.kpi_score ?? 0,
  }));

  const attentionItems = [
    ...reps.filter(r => (r.tasks_overdue ?? 0) > 3).map(r => ({ label: `${r.name} — ${r.tasks_overdue} overdue tasks`, type: 'rep' as const })),
    ...territories.filter(t => t.status === 'underperforming' || t.status === 'at-risk').map(t => ({ label: `${t.name} — ${t.status}`, type: 'territory' as const })),
    ...dealers.filter(d => d.status === 'at-risk').map(d => ({ label: `${d.name} — at risk`, type: 'dealer' as const })),
  ];

  const activityIcons: Record<string, typeof Phone> = { call: Phone, email: Mail, meeting: Users, task: CheckCircle, alert: AlertTriangle };

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="page-header"><h1 className="page-title">Loading...</h1></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-5">
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Sales Overview</h1>
        <p className="page-subtitle">{reps.length} reps • {territories.length} territories • {dealers.length} dealers</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard title="Sales Reps" value={reps.length} icon={Users} trend="neutral" subtitle="assigned" />
        <StatCard title="Territories" value={territories.length} icon={Map} trend="neutral" subtitle="active" />
        <StatCard title="Dealers" value={dealers.length} icon={Store} trend="neutral" subtitle="total" />
        <StatCard title="Revenue" value={formatCurrency(totalRevenue)} trend="neutral" variant="accent" />
        <StatCard title="Quota Attain." value={totalQuota > 0 ? `${Math.round(totalRevenue / totalQuota * 100)}%` : '—'} trend="neutral" variant="success" />
        <StatCard title="Overdue" value={totalOverdue} trend="neutral" trendValue={`${totalPending} pending`} variant={totalOverdue > 10 ? 'destructive' : 'warning'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Rep Revenue vs Quota ($K)</h3>
          <div className="h-[240px]">
            {repChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={repChartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 90%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `$${v}K`} />
                  <Bar dataKey="revenue" fill="hsl(220 35% 22%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="quota" fill="hsl(38 75% 50%)" radius={[4, 4, 0, 0]} opacity={0.5} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center pt-20">No revenue data synced yet.</p>
            )}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" /> Attention Needed
          </h3>
          <div className="space-y-3">
            {attentionItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                <span className="text-muted-foreground">{item.label}</span>
              </div>
            ))}
            {attentionItems.length === 0 && <p className="text-sm text-muted-foreground">All clear — no items need attention.</p>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Territory KPI Scores</h3>
          <div className="h-[220px]">
            {territoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={territoryChartData} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 90%)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="kpi" fill="hsl(152 60% 40%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center pt-20">No KPI data synced yet.</p>
            )}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {activities.length > 0 ? activities.slice(0, 5).map(a => {
              const Icon = activityIcons[a.type ?? 'task'] ?? CheckCircle;
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="mt-0.5 h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{a.title}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(a.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground">No activity logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
