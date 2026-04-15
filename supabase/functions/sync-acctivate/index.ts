import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { Connection, Request as TdsRequest, TYPES } from "npm:tedious@19";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface MssqlRow {
  [key: string]: unknown;
}

function connectToAcctivate(): Promise<Connection> {
  const host = Deno.env.get("ACCTIVATE_DB_HOST");
  const port = Deno.env.get("ACCTIVATE_DB_PORT");
  const user = Deno.env.get("ACCTIVATE_DB_USER");
  const password = Deno.env.get("ACCTIVATE_DB_PASSWORD");
  const database = Deno.env.get("ACCTIVATE_DB_NAME");

  if (!host || !user || !password || !database) {
    throw new Error("Missing Acctivate SQL Server credentials.");
  }

  return new Promise((resolve, reject) => {
    const connection = new Connection({
      server: host,
      authentication: {
        type: "default",
        options: { userName: user, password },
      },
      options: {
        port: port ? parseInt(port) : 51924,
        database,
        encrypt: true,
        trustServerCertificate: true,
        connectTimeout: 30000,
        requestTimeout: 60000,
      },
    });

    connection.on("connect", (err: Error | undefined) => {
      if (err) {
        reject(new Error(`MSSQL connection failed: ${err.message}`));
      } else {
        resolve(connection);
      }
    });

    connection.on("error", (err: Error) => {
      reject(new Error(`MSSQL connection error: ${err.message}`));
    });

    connection.connect();
  });
}

function queryMssql(connection: Connection, sql: string): Promise<MssqlRow[]> {
  return new Promise((resolve, reject) => {
    const rows: MssqlRow[] = [];

    const request = new TdsRequest(sql, (err: Error | null) => {
      if (err) {
        reject(new Error(`MSSQL query failed: ${err.message}`));
      } else {
        resolve(rows);
      }
    });

    request.on("row", (columns: Array<{ metadata: { colName: string }; value: unknown }>) => {
      const row: MssqlRow = {};
      columns.forEach((col) => {
        row[col.metadata.colName] = col.value;
      });
      rows.push(row);
    });

    connection.execSql(request);
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let connection: Connection | null = null;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Connecting to Acctivate SQL Server...");
    connection = await connectToAcctivate();
    console.log("Connected to Acctivate SQL Server successfully.");

    const results: Record<string, { synced: number; errors: string[] }> = {};

    // ─── SYNC SALES REPS ─────────────────────────────
    // Adjust these SQL queries to match your actual Acctivate table/column names
    try {
      const reps = await queryMssql(connection, `
        SELECT 
          SalesRepID AS acctivate_id,
          SalesRepName AS name,
          Email AS email,
          Phone AS phone
        FROM SalesRep
        WHERE IsActive = 1
      `);

      for (const row of reps) {
        const { error } = await supabase.from("sales_reps").upsert(
          {
            acctivate_id: String(row.acctivate_id),
            name: String(row.name || "Unknown"),
            email: row.email ? String(row.email) : null,
            phone: row.phone ? String(row.phone) : null,
            status: "active",
          },
          { onConflict: "acctivate_id" }
        );
        if (error) console.error("Error upserting rep:", error.message);
      }
      results.sales_reps = { synced: reps.length, errors: [] };
    } catch (e) {
      console.error("Error syncing sales reps:", (e as Error).message);
      results.sales_reps = { synced: 0, errors: [(e as Error).message] };
    }

    // ─── SYNC TERRITORIES ────────────────────────────
    try {
      const territories = await queryMssql(connection, `
        SELECT 
          TerritoryID AS acctivate_id,
          TerritoryName AS name,
          Region AS region,
          State AS state
        FROM SalesTerritory
      `);

      for (const row of territories) {
        const { error } = await supabase.from("territories").upsert(
          {
            acctivate_id: String(row.acctivate_id),
            name: String(row.name || "Unknown"),
            region: row.region ? String(row.region) : null,
            state: row.state ? String(row.state) : null,
            status: "on-track",
          },
          { onConflict: "acctivate_id" }
        );
        if (error) console.error("Error upserting territory:", error.message);
      }
      results.territories = { synced: territories.length, errors: [] };
    } catch (e) {
      console.error("Error syncing territories:", (e as Error).message);
      results.territories = { synced: 0, errors: [(e as Error).message] };
    }

    // ─── SYNC DEALERS / CUSTOMERS ────────────────────
    try {
      const dealers = await queryMssql(connection, `
        SELECT 
          CustomerID AS acctivate_id,
          CompanyName AS name,
          City AS city,
          State AS state,
          Phone AS phone,
          Email AS email,
          WebAddress AS website,
          SalesRepID AS rep_acctivate_id,
          TerritoryID AS territory_acctivate_id
        FROM Customer
        WHERE IsActive = 1
      `);

      for (const row of dealers) {
        let repId = null;
        let territoryId = null;

        if (row.rep_acctivate_id) {
          const { data } = await supabase
            .from("sales_reps").select("id")
            .eq("acctivate_id", String(row.rep_acctivate_id))
            .maybeSingle();
          repId = data?.id || null;
        }

        if (row.territory_acctivate_id) {
          const { data } = await supabase
            .from("territories").select("id")
            .eq("acctivate_id", String(row.territory_acctivate_id))
            .maybeSingle();
          territoryId = data?.id || null;
        }

        const { error } = await supabase.from("dealers").upsert(
          {
            acctivate_id: String(row.acctivate_id),
            name: String(row.name || "Unknown"),
            city: row.city ? String(row.city) : null,
            state: row.state ? String(row.state) : null,
            phone: row.phone ? String(row.phone) : null,
            email: row.email ? String(row.email) : null,
            website: row.website ? String(row.website) : null,
            rep_id: repId,
            territory_id: territoryId,
            status: "active",
          },
          { onConflict: "acctivate_id" }
        );
        if (error) console.error("Error upserting dealer:", error.message);
      }
      results.dealers = { synced: dealers.length, errors: [] };
    } catch (e) {
      console.error("Error syncing dealers:", (e as Error).message);
      results.dealers = { synced: 0, errors: [(e as Error).message] };
    }

    // Close connection
    connection.close();
    console.log("Sync complete:", JSON.stringify(results));

    return new Response(
      JSON.stringify({ success: true, synced_at: new Date().toISOString(), results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    if (connection) try { connection.close(); } catch (_) {}
    console.error("Sync failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
