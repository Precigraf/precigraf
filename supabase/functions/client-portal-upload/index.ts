import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIMES = new Set<string>([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
  "application/x-zip-compressed",
  "application/postscript", // .ai .eps
  "application/illustrator",
  "application/octet-stream", // .cdr / generic
  "image/svg+xml",
  "image/tiff",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405);
    }

    const form = await req.formData();
    const token = String(form.get("token") || "");
    const orderIdRaw = form.get("order_id");
    const orderId = orderIdRaw && String(orderIdRaw).length > 0 ? String(orderIdRaw) : null;
    const file = form.get("file") as File | null;

    if (!token || !file) return json({ error: "missing_fields" }, 400);
    if (!isUuid(token)) return json({ error: "invalid_token" }, 400);
    if (orderId && !isUuid(orderId)) return json({ error: "invalid_order" }, 400);
    if (file.size <= 0) return json({ error: "empty_file" }, 400);
    if (file.size > MAX_SIZE) return json({ error: "file_too_large" }, 413);
    if (file.type && !ALLOWED_MIMES.has(file.type)) {
      // fallback: accept by extension
      if (!/\.(pdf|png|jpe?g|webp|zip|ai|eps|cdr|svg|tiff?)$/i.test(file.name)) {
        return json({ error: "unsupported_type" }, 415);
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // rate limit por token
    const rl = await supabase.rpc("check_rate_limit", {
      p_identifier: `portal:${token}`,
      p_action_type: "portal_upload",
      p_max_requests: 20,
      p_window_seconds: 600,
    });
    if (rl.data && (rl.data as any).allowed === false) {
      return json({ error: "rate_limited" }, 429);
    }

    // resolve client
    const { data: portal, error: portalErr } = await supabase.rpc("get_client_portal", { p_token: token });
    if (portalErr || !portal || (portal as any).error) {
      return json({ error: "not_found" }, 404);
    }
    const clientId = (portal as any).client?.id as string | undefined;
    if (!clientId) return json({ error: "not_found" }, 404);

    // descobrir user_id via tabela clients (service role)
    const { data: clientRow, error: clientErr } = await supabase
      .from("clients")
      .select("user_id")
      .eq("id", clientId)
      .single();
    if (clientErr || !clientRow) return json({ error: "not_found" }, 404);

    const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
    const fileId = crypto.randomUUID();
    const path = `${clientRow.user_id}/${clientId}/${fileId}-${safeName}`;

    const buf = new Uint8Array(await file.arrayBuffer());
    const upload = await supabase.storage.from("client-portal").upload(path, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (upload.error) {
      return json({ error: "upload_failed", detail: upload.error.message }, 500);
    }

    const reg = await supabase.rpc("register_client_portal_upload", {
      p_token: token,
      p_order_id: orderId,
      p_file_name: safeName,
      p_file_path: path,
      p_size: file.size,
      p_mime: file.type || null,
    });
    if (reg.error || (reg.data as any)?.success === false) {
      await supabase.storage.from("client-portal").remove([path]);
      return json({ error: (reg.data as any)?.error || "register_failed" }, 400);
    }

    return json({ success: true, id: (reg.data as any).id });
  } catch (e) {
    return json({ error: "internal_error", detail: String(e?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
