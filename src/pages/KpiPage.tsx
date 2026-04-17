import { LiveKpiReport } from "@/components/LiveKpiReport";

export default function KpiPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">KPI Performance</h1>
        <p className="page-subtitle">Live monthly bookings, invoiced and rep performance</p>
      </div>
      <LiveKpiReport />
    </div>
  );
}
