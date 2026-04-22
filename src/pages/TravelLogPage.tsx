import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { Plane, Search, RefreshCw, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TravelEntry {
  id: string;
  rep_id: string | null;
  salesperson_name: string | null;
  travel_date: string;
  travel_end_date: string | null;
  purpose: string | null;
  approval_status: string | null;
  notes: string | null;
  monday_id: string | null;
}

export default function TravelLogPage() {
  const { toast } = useToast();
  const [travel, setTravel] = useState<TravelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("travel_log")
      .select("id, rep_id, salesperson_name, travel_date, travel_end_date, purpose, approval_status, notes, monday_id")
      .order("travel_date", { ascending: false })
      .limit(500);
    if (error) {
      toast({ title: "Failed to load travel log", description: error.message, variant: "destructive" });
    } else {
      setTravel((data ?? []) as TravelEntry[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const syncFromMonday = async () => {
    setSyncing(true);
    const { error } = await supabase.functions.invoke("sync-travel-log");
    setSyncing(false);
    if (error) {
      toast({ title: "Sync failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Synced from monday.com" });
    load();
  };

  // Last travel per salesperson
  const lastByPerson = useMemo(() => {
    const m = new Map<string, TravelEntry>();
    for (const t of travel) {
      const key = t.salesperson_name || t.rep_id || t.id;
      const cur = m.get(key);
      if (!cur || cur.travel_date < t.travel_date) m.set(key, t);
    }
    return Array.from(m.values()).sort((a, b) =>
      a.travel_date < b.travel_date ? 1 : -1,
    );
  }, [travel]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return travel;
    return travel.filter(
      (t) =>
        (t.salesperson_name ?? "").toLowerCase().includes(q) ||
        (t.purpose ?? "").toLowerCase().includes(q) ||
        (t.notes ?? "").toLowerCase().includes(q),
    );
  }, [travel, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif font-semibold flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" /> Travel Log
          </h1>
          <p className="text-sm text-muted-foreground">
            Synced from the monday.com travel log board.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search rep, purpose, notes…"
              className="pl-8 h-9 w-[260px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button size="sm" variant="outline" onClick={syncFromMonday} disabled={syncing} className="h-9">
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Sync
          </Button>
        </div>
      </div>

      {/* Last traveled per salesperson */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3">Last traveled by salesperson</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : lastByPerson.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No travel records synced yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lastByPerson.map((t) => {
              const days = Math.floor(
                (Date.now() - new Date(t.travel_date).getTime()) / 86400000,
              );
              return (
                <div key={t.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {t.salesperson_name ?? "Unknown rep"}
                      </p>
                      {t.purpose && (
                        <p className="text-xs text-muted-foreground truncate">{t.purpose}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold">
                        {format(new Date(t.travel_date), "MMM d, yyyy")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {days === 0 ? "today" : `${days}d ago`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Full log */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-sm font-semibold">All travel records</h2>
          <span className="text-xs text-muted-foreground">{filtered.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salesperson</TableHead>
                <TableHead>Travel date</TableHead>
                <TableHead>End date</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6 italic">
                    No matching records.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      {t.salesperson_name ?? "—"}
                    </TableCell>
                    <TableCell>{format(new Date(t.travel_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      {t.travel_end_date ? format(new Date(t.travel_end_date), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate">{t.purpose ?? "—"}</TableCell>
                    <TableCell>
                      {t.approval_status ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {t.approval_status}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(t.travel_date), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
