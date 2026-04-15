import { Users, Map, Store, AlertTriangle, CheckCircle, Clock, TrendingUp, Mail, Phone, ExternalLink } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { KpiGauge } from "@/components/KpiGauge";
import { salesReps, territories, dealers, activities, currentManager, formatCurrency, monthlyKpi } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const totalOverdue = salesReps.reduce((s, r) => s + r.tasksOverdue, 0);
const totalPending = salesReps.reduce((s, r) => s + r.tasksPending, 0);
const totalRevenue = salesReps.reduce((s, r) => s + r.revenue, 0);
const totalQuota = salesReps.reduce((s, r) => s + r.quota, 0);

const repChartData = salesReps.map(r => ({
  name: r.name.split(' ')[1],
  revenue: r.revenue / 1000,
  quota: r.quota / 1000,
}));

const territoryChartData = territories.map(t => ({
  name: t.name.length > 12 ? t.name.slice(0, 12) + '…' : t.name,
  kpi: t.kpiScore,
  dealers: t.dealerCount,
}));

const attentionItems = [
  ...salesReps.filter(r => r.tasksOverdue > 3).map(r => ({ label: `${r.name} — ${r.tasksOverdue} overdue tasks`, type: 'rep' as const })),
  ...territories.filter(t => t.status === 'underperforming' || t.status === 'at-risk').map(t => ({ label: `${t.name} — ${t.status}`, type: 'territory' as const })),
  ...dealers.filter(d => d.status === 'at-risk').map(d => ({ label: `${d.name} — at risk`, type: 'dealer' as const })),
];

const activityIcons = { call: Phone, email: Mail, meeting: Users, task: CheckCircle, alert: AlertTriangle };

export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {currentManager.name.split(' ')[0]}</h1>
        <p className="page-subtitle">Here's your sales overview for {currentManager.region}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard title="Sales Reps" value={salesReps.length} icon={Users} trend="neutral" subtitle="assigned" />
        <StatCard title="Territories" value={territories.length} icon={Map} trend="neutral" subtitle="active" />
        <StatCard title="Dealers" value={dealers.length} icon={Store} trend="up" trendValue="+2" subtitle="this month" />
        <StatCard title="Revenue" value={formatCurrency(totalRevenue)} trend="up" trendValue="+8%" variant="accent" />
        <StatCard title="Quota Attain." value={`${Math.round(totalRevenue / totalQuota * 100)}%`} trend={totalRevenue / totalQuota >= 0.85 ? 'up' : 'down'} trendValue={formatCurrency(totalQuota - totalRevenue) + ' gap'} variant="success" />
        <StatCard title="Overdue" value={totalOverdue} trend="down" trendValue={`${totalPending} pending`} variant={totalOverdue > 10 ? 'destructive' : 'warning'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        {/* Rep Performance Chart */}
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Rep Revenue vs Quota ($K)</h3>
          <div className="h-[240px]">
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
          </div>
        </div>

        {/* Attention Needed */}
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
        {/* Territory KPI Chart */}
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Territory KPI Scores</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={territoryChartData} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 90%)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="kpi" fill="hsl(152 60% 40%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {activities.slice(0, 5).map(a => {
              const Icon = activityIcons[a.type];
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
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
