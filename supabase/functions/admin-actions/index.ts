import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client with user's token for auth verification
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // Verify admin role
    const { data: roleCheck } = await userClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!roleCheck) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    // Service role client for admin operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { action, ...params } = await req.json();

    switch (action) {
      case "list_users": {
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("user_id, email, plan, plan_id, trial_ends_at, created_at, subscription_status, subscription_current_period_end, company_name")
          .order("created_at", { ascending: false });

        const { data: users } = await adminClient
          .from("users")
          .select("user_id, name, status, last_login");

        const { data: plans } = await adminClient
          .from("subscription_plans")
          .select("id, name");

        const usersMap = new Map(
          (users || []).map((u: any) => [u.user_id, u])
        );
        const plansMap = new Map(
          (plans || []).map((p: any) => [p.id, p.name])
        );

        const merged = (profiles || []).map((p: any) => ({
          user_id: p.user_id,
          email: p.email,
          name: usersMap.get(p.user_id)?.name || p.email?.split("@")[0],
          status: usersMap.get(p.user_id)?.status || "ativo",
          plan: p.plan,
          plan_name: plansMap.get(p.plan_id) || p.plan,
          plan_id: p.plan_id,
          trial_ends_at: p.trial_ends_at,
          subscription_status: p.subscription_status,
          subscription_current_period_end: p.subscription_current_period_end,
          company_name: p.company_name,
          last_login: usersMap.get(p.user_id)?.last_login,
          created_at: p.created_at,
        }));

        return jsonResponse({ users: merged, plans: plans || [] });
      }

      case "update_user_plan": {
        const { target_user_id, plan_name } = params;
        if (!target_user_id || !plan_name) {
          return jsonResponse({ error: "Missing parameters" }, 400);
        }

        const { data: plan } = await adminClient
          .from("subscription_plans")
          .select("id")
          .eq("name", plan_name)
          .single();

        if (!plan) {
          return jsonResponse({ error: "Plan not found" }, 404);
        }

        const { error } = await adminClient
          .from("profiles")
          .update({ plan_id: plan.id, updated_at: new Date().toISOString() })
          .eq("user_id", target_user_id);

        if (error) {
          return jsonResponse({ error: error.message }, 500);
        }

        // Log the action
        await adminClient.from("security_logs").insert({
          user_id: userId,
          event_type: "admin_plan_change",
          event_description: `Admin changed user ${target_user_id} plan to ${plan_name}`,
          metadata: { target_user_id, plan_name },
        });

        return jsonResponse({ success: true });
      }

      case "toggle_user_status": {
        const { target_user_id, new_status } = params;
        if (!target_user_id || !new_status) {
          return jsonResponse({ error: "Missing parameters" }, 400);
        }

        const { error } = await adminClient
          .from("users")
          .update({ status: new_status })
          .eq("user_id", target_user_id);

        if (error) {
          return jsonResponse({ error: error.message }, 500);
        }

        await adminClient.from("security_logs").insert({
          user_id: userId,
          event_type: "admin_status_change",
          event_description: `Admin changed user ${target_user_id} status to ${new_status}`,
          metadata: { target_user_id, new_status },
        });

        return jsonResponse({ success: true });
      }

      case "get_metrics": {
        const { data: totalUsers } = await adminClient
          .from("profiles")
          .select("user_id", { count: "exact", head: true });

        const { data: proUsers } = await adminClient
          .from("profiles")
          .select("user_id", { count: "exact", head: true })
          .eq("plan", "pro");

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: newThisMonth } = await adminClient
          .from("profiles")
          .select("user_id", { count: "exact", head: true })
          .gte("created_at", startOfMonth.toISOString());

        // Get monthly growth data (last 6 months)
        const { data: allProfiles } = await adminClient
          .from("profiles")
          .select("created_at")
          .order("created_at", { ascending: true });

        const monthlyGrowth: { month: string; count: number }[] = [];
        if (allProfiles) {
          const now = new Date();
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const count = allProfiles.filter((p: any) => {
              const created = new Date(p.created_at);
              return created >= d && created <= end;
            }).length;
            monthlyGrowth.push({
              month: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
              count,
            });
          }
        }

        return jsonResponse({
          total_users: totalUsers,
          pro_users: proUsers,
          new_this_month: newThisMonth,
          monthly_growth: monthlyGrowth,
        });
      }

      case "get_security_logs": {
        const { page = 1, event_type, limit = 50 } = params;
        const offset = (page - 1) * limit;

        let query = adminClient
          .from("security_logs")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (event_type) {
          query = query.eq("event_type", event_type);
        }

        const { data: logs, count, error } = await query;

        if (error) {
          return jsonResponse({ error: error.message }, 500);
        }

        return jsonResponse({ logs: logs || [], total: count || 0, page, limit });
      }

      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    console.error("Admin action error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
