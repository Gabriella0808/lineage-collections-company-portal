import { useState } from "react";
import { Mail, Phone, ExternalLink } from "lucide-react";
import { FilterBar } from "@/components/FilterBar";
import { StatusBadge } from "@/components/StatusBadge";
import { dealers, salesReps, territories, getRepName, getTerritoryName, formatCurrency } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function DealersPage() {
  const [search, setSearch] = useState("");
  const [territoryFilter, setTerritoryFilter] = useState("all");
  const [repFilter, setRepFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = dealers.filter(d => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (territoryFilter !== "all" && d.territoryId !== territoryFilter) return false;
    if (repFilter !== "all" && d.repId !== repFilter) return false;
    return true;
  });

  const dealer = dealers.find(d => d.id === selected);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dealers</h1>
        <p className="page-subtitle">{dealers.length} dealers across your territories</p>
      </div>

      <FilterBar
        searchPlaceholder="Search dealers..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          { label: "Territory", value: territoryFilter, onChange: setTerritoryFilter, options: territories.map(t => ({ label: t.name, value: t.id })) },
          { label: "Rep", value: repFilter, onChange: setRepFilter, options: salesReps.map(r => ({ label: r.name, value: r.id })) },
        ]}
      />

      <div className="table-container">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-medium text-muted-foreground">Dealer</th>
              <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Location</th>
              <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Territory</th>
              <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Rep</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Engagement</th>
              <th className="text-right p-3 font-medium text-muted-foreground hidden lg:table-cell">Revenue</th>
              <th className="text-center p-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelected(d.id)}>
                <td className="p-3 font-medium">{d.name}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{d.city}, {d.state}</td>
                <td className="p-3 hidden lg:table-cell"><span className="text-xs bg-muted px-2 py-0.5 rounded-full">{getTerritoryName(d.territoryId)}</span></td>
                <td className="p-3 hidden lg:table-cell text-muted-foreground">{getRepName(d.repId)}</td>
                <td className="p-3"><StatusBadge status={d.status} /></td>
                <td className="p-3 hidden md:table-cell"><StatusBadge status={d.engagement} /></td>
                <td className="p-3 text-right hidden lg:table-cell font-medium">{formatCurrency(d.revenue)}</td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); window.location.href = `mailto:${d.email}`; }}><Mail className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); window.location.href = `tel:${d.phone}`; }}><Phone className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">No dealers match your filters.</p>}
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {dealer && (
            <>
              <SheetHeader>
                <SheetTitle>{dealer.name}</SheetTitle>
                <p className="text-xs text-muted-foreground">{dealer.city}, {dealer.state}</p>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="flex items-center gap-3">
                  <StatusBadge status={dealer.status} />
                  <StatusBadge status={dealer.engagement} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="stat-card"><p className="text-[11px] text-muted-foreground uppercase">Revenue</p><p className="text-lg font-semibold">{formatCurrency(dealer.revenue)}</p></div>
                  <div className="stat-card"><p className="text-[11px] text-muted-foreground uppercase">Last Contact</p><p className="text-lg font-semibold">{new Date(dealer.lastContact).toLocaleDateString()}</p></div>
                </div>

                <div className="space-y-3">
                  <div><p className="text-[11px] text-muted-foreground uppercase mb-1">Territory</p><p className="text-sm">{getTerritoryName(dealer.territoryId)}</p></div>
                  <div><p className="text-[11px] text-muted-foreground uppercase mb-1">Assigned Rep</p><p className="text-sm">{getRepName(dealer.repId)}</p></div>
                  <div><p className="text-[11px] text-muted-foreground uppercase mb-1">Phone</p><p className="text-sm">{dealer.phone}</p></div>
                  <div><p className="text-[11px] text-muted-foreground uppercase mb-1">Email</p><p className="text-sm">{dealer.email}</p></div>
                  <div><p className="text-[11px] text-muted-foreground uppercase mb-1">Website</p>
                    <a href={`https://${dealer.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline flex items-center gap-1">{dealer.website} <ExternalLink className="h-3 w-3" /></a>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.location.href = `mailto:${dealer.email}`}><Mail className="h-3.5 w-3.5 mr-2" /> Email</Button>
                  <Button size="sm" variant="outline" onClick={() => window.location.href = `tel:${dealer.phone}`}><Phone className="h-3.5 w-3.5 mr-2" /> Call</Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(`https://${dealer.website}`, '_blank')}><ExternalLink className="h-3.5 w-3.5 mr-2" /> Website</Button>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Recent Interactions</h4>
                  <div className="rounded-lg border border-border p-3 min-h-[60px] text-sm text-muted-foreground">No interactions logged yet.</div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Notes</h4>
                  <div className="rounded-lg border border-border p-3 min-h-[60px] text-sm text-muted-foreground">No notes yet.</div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
