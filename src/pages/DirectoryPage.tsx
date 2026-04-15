import { useState } from "react";
import { Mail, Phone, ExternalLink, Copy } from "lucide-react";
import { FilterBar } from "@/components/FilterBar";
import { contacts, territories } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DirectoryPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [territoryFilter, setTerritoryFilter] = useState("all");
  const { toast } = useToast();

  const filtered = contacts.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.company.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== "all" && c.role !== roleFilter) return false;
    if (territoryFilter !== "all" && !c.territory.toLowerCase().includes(territories.find(t => t.id === territoryFilter)?.name.toLowerCase() || '')) return false;
    return true;
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  const roleBadgeClass: Record<string, string> = {
    dealer: 'bg-accent/15 text-accent-foreground',
    rep: 'bg-primary/10 text-primary',
    manager: 'bg-success/10 text-success',
    other: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Directory</h1>
        <p className="page-subtitle">{contacts.length} contacts in your network</p>
      </div>

      <FilterBar
        searchPlaceholder="Search by name or company..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          { label: "Role", value: roleFilter, onChange: setRoleFilter, options: [{ label: 'Dealer', value: 'dealer' }, { label: 'Rep', value: 'rep' }, { label: 'Manager', value: 'manager' }, { label: 'Other', value: 'other' }] },
          { label: "Territory", value: territoryFilter, onChange: setTerritoryFilter, options: territories.map(t => ({ label: t.name, value: t.id })) },
        ]}
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="glass-card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{c.name}</h3>
                <p className="text-xs text-muted-foreground">{c.title} • {c.company}</p>
              </div>
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${roleBadgeClass[c.role]}`}>{c.role}</span>
            </div>

            {c.territory && <p className="text-[11px] text-muted-foreground mb-3">{c.territory}</p>}

            <div className="space-y-1.5 text-xs mb-3">
              {c.phone && (
                <div className="flex items-center justify-between group">
                  <span className="text-muted-foreground">{c.phone}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => copyToClipboard(c.phone, 'Phone')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {c.email && (
                <div className="flex items-center justify-between group">
                  <span className="text-muted-foreground truncate">{c.email}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0" onClick={() => copyToClipboard(c.email, 'Email')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 pt-2 border-t">
              {c.email && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.location.href = `mailto:${c.email}`}><Mail className="h-3.5 w-3.5" /></Button>}
              {c.phone && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.location.href = `tel:${c.phone}`}><Phone className="h-3.5 w-3.5" /></Button>}
              {c.website && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`https://${c.website}`, '_blank')}><ExternalLink className="h-3.5 w-3.5" /></Button>}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">No contacts match your search.</p>}
    </div>
  );
}
