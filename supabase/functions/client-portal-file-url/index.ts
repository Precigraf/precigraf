import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { token, file_id } = await req.json();
    if (!token || !file_id) return json({ error: "missing_fields" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const meta = await supabase.rpc("get_client_portal_file_meta", { p_token: token, p_file_id: file_id });
    if (meta.error || (meta.data as any)?.error) return json({ error: "not_found" }, 404);
    const { file_path, file_name } = meta.data as any;

    const signed = await supabase.storage.from("client-portal").createSignedUrl(file_path, 60, {
      download: file_name,
    });
    if (signed.error) return json({ error: "sign_failed" }, 500);

    return json({ url: signed.data.signedUrl });
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
