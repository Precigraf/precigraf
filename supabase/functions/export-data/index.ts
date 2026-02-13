import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EXPORTABLE_TABLES = [
  "profiles",
  "users",
  "calculations",
  "subscription_plans",
  "user_roles",
  "device_fingerprints",
  "security_logs",
  "pending_payments",
  "rate_limits",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Action: get schema SQL
    if (action === "schema") {
      const { data, error } = await adminClient.rpc("get_table_schemas" as any);
      
      // Fallback: query information_schema directly
      const tables = EXPORTABLE_TABLES;
      const schemas: Record<string, any[]> = {};

      for (const table of tables) {
        const { data: cols } = await adminClient
          .from(table)
          .select("*")
          .limit(0);
        
        // Get column info by selecting one row
        const { data: sampleRow } = await adminClient
          .from(table)
          .select("*")
          .limit(1);

        schemas[table] = {
          columns: sampleRow && sampleRow.length > 0 ? Object.keys(sampleRow[0]) : [],
          sample: sampleRow?.[0] || null,
        };
      }

      return new Response(JSON.stringify({ schemas }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: list tables
    if (action === "tables") {
      return new Response(JSON.stringify({ tables: EXPORTABLE_TABLES }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: export table as CSV
    if (action === "export") {
      const table = url.searchParams.get("table");

      if (!table || !EXPORTABLE_TABLES.includes(table)) {
        return new Response(
          JSON.stringify({ error: "Invalid table name" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data, error } = await adminClient.from(table).select("*");

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!data || data.length === 0) {
        return new Response("", {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${table}.csv"`,
          },
        });
      }

      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map((row: any) =>
          headers
            .map((h) => {
              const val = row[h];
              if (val === null || val === undefined) return "";
              const str = typeof val === "object" ? JSON.stringify(val) : String(val);
              return `"${str.replace(/"/g, '""')}"`;
            })
            .join(",")
        ),
      ];
      const csv = csvRows.join("\n");

      return new Response(csv, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${table}.csv"`,
        },
      });
    }

    // Action: export all
    if (action === "export-all") {
      const allData: Record<string, any[]> = {};

      for (const table of EXPORTABLE_TABLES) {
        const { data } = await adminClient.from(table).select("*");
        allData[table] = data || [];
      }

      return new Response(JSON.stringify(allData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: storage info
    if (action === "storage") {
      const { data: buckets } = await adminClient.storage.listBuckets();
      const storageInfo: any[] = [];

      if (buckets) {
        for (const bucket of buckets) {
          const { data: files } = await adminClient.storage
            .from(bucket.name)
            .list("", { limit: 1000 });
          storageInfo.push({
            bucket: bucket.name,
            public: bucket.public,
            files: files || [],
          });
        }
      }

      return new Response(JSON.stringify({ storage: storageInfo }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: tables, export, export-all, schema, storage" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
