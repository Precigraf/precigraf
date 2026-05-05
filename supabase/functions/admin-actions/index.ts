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

      case "get_dashboard": {
        const PRO_MONTHLY_PRICE = 29.9;
        const LIFETIME_PRICE = 297;

        const { count: totalUsers } = await adminClient
          .from("profiles").select("user_id", { count: "exact", head: true });
        const { count: freeUsers } = await adminClient
          .from("profiles").select("user_id", { count: "exact", head: true }).eq("plan", "free");
        const { count: proUsers } = await adminClient
          .from("profiles").select("user_id", { count: "exact", head: true }).eq("plan", "pro");

        // Active monthly subscriptions
        const { count: activeMonthly } = await adminClient
          .from("profiles")
          .select("user_id", { count: "exact", head: true })
          .in("subscription_status", ["active", "trialing"]);

        // Lifetime users (plan_id == lifetime)
        const { data: lifetimePlan } = await adminClient
          .from("subscription_plans").select("id").eq("name", "lifetime").single();
        let lifetimeCount = 0;
        if (lifetimePlan?.id) {
          const { count } = await adminClient
            .from("profiles").select("user_id", { count: "exact", head: true }).eq("plan_id", lifetimePlan.id);
          lifetimeCount = count || 0;
        }

        const mrr = (activeMonthly || 0) * PRO_MONTHLY_PRICE;
        const lifetimeRevenue = lifetimeCount * LIFETIME_PRICE;

        const startOfMonth = new Date();
        startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
        const { count: newThisMonth } = await adminClient
          .from("profiles").select("user_id", { count: "exact", head: true })
          .gte("created_at", startOfMonth.toISOString());

        return jsonResponse({
          total_users: totalUsers || 0,
          free_users: freeUsers || 0,
          pro_users: proUsers || 0,
          active_monthly: activeMonthly || 0,
          lifetime_users: lifetimeCount,
          mrr,
          lifetime_revenue: lifetimeRevenue,
          total_subscription_revenue: mrr + lifetimeRevenue,
          new_this_month: newThisMonth || 0,
        });
      }

      case "list_employees": {
        const { data: roles } = await adminClient
          .from("user_roles").select("user_id, role").neq("role", "user");
        const ids = [...new Set((roles || []).map((r: any) => r.user_id))];
        if (ids.length === 0) return jsonResponse({ employees: [] });
        const { data: profiles } = await adminClient
          .from("profiles").select("user_id, email, company_name").in("user_id", ids);
        const { data: usersData } = await adminClient
          .from("users").select("user_id, name, status").in("user_id", ids);
        const pmap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        const umap = new Map((usersData || []).map((u: any) => [u.user_id, u]));
        const grouped = new Map<string, string[]>();
        for (const r of roles || []) {
          if (!grouped.has(r.user_id)) grouped.set(r.user_id, []);
          grouped.get(r.user_id)!.push(r.role);
        }
        const employees = ids.map((id) => ({
          user_id: id,
          email: pmap.get(id)?.email,
          name: umap.get(id)?.name,
          status: umap.get(id)?.status,
          roles: grouped.get(id) || [],
        }));
        return jsonResponse({ employees });
      }

      case "list_roles": {
        const { data, error } = await adminClient
          .from("user_roles").select("user_id, role").order("created_at", { ascending: false });
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ roles: data || [] });
      }

      case "assign_role": {
        const { target_user_id, role } = params;
        if (!target_user_id || !role) return jsonResponse({ error: "Missing parameters" }, 400);
        const { error } = await adminClient.from("user_roles")
          .insert({ user_id: target_user_id, role })
          .select().maybeSingle();
        if (error && !error.message.includes("duplicate")) {
          return jsonResponse({ error: error.message }, 500);
        }
        await adminClient.from("security_logs").insert({
          user_id: userId, event_type: "admin_role_assigned",
          event_description: `Admin assigned role ${role} to ${target_user_id}`,
          metadata: { target_user_id, role },
        });
        return jsonResponse({ success: true });
      }

      case "revoke_role": {
        const { target_user_id, role } = params;
        if (!target_user_id || !role) return jsonResponse({ error: "Missing parameters" }, 400);
        if (target_user_id === userId && role === "admin") {
          return jsonResponse({ error: "Você não pode remover seu próprio acesso de admin" }, 400);
        }
        const { error } = await adminClient.from("user_roles")
          .delete().eq("user_id", target_user_id).eq("role", role);
        if (error) return jsonResponse({ error: error.message }, 500);
        await adminClient.from("security_logs").insert({
          user_id: userId, event_type: "admin_role_revoked",
          event_description: `Admin revoked role ${role} from ${target_user_id}`,
          metadata: { target_user_id, role },
        });
        return jsonResponse({ success: true });
      }

      case "list_payments": {
        const { data: pending } = await adminClient
          .from("pending_payments")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        const { data: subs } = await adminClient
          .from("profiles")
          .select("user_id, email, subscription_status, subscription_current_period_end, subscription_canceled_at, stripe_subscription_id, stripe_customer_id")
          .not("stripe_subscription_id", "is", null)
          .order("subscription_current_period_end", { ascending: false, nullsFirst: false })
          .limit(200);
        return jsonResponse({ pending_payments: pending || [], subscriptions: subs || [] });
      }

      case "list_plans": {
        const { data: plans } = await adminClient.from("subscription_plans").select("*");
        const stats: any[] = [];
        for (const p of plans || []) {
          const { count } = await adminClient
            .from("profiles").select("user_id", { count: "exact", head: true }).eq("plan_id", p.id);
          stats.push({ ...p, subscriber_count: count || 0 });
        }
        return jsonResponse({ plans: stats });
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
