import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Webhook secret is REQUIRED — reject all requests if it's not configured
    const webhookSecret = Deno.env.get("INFINITEPAY_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("INFINITEPAY_WEBHOOK_SECRET is not configured");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read raw body so we can verify HMAC over the exact bytes
    const rawBody = await req.text();

    const signatureHeader =
      req.headers.get("x-webhook-signature") ||
      req.headers.get("x-infinitepay-signature") ||
      req.headers.get("x-signature") ||
      "";

    // Compute expected HMAC-SHA256 of the body using the secret
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sigBuf = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(rawBody),
    );
    const expected = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Strip optional "sha256=" prefix providers sometimes include
    const provided = signatureHeader.replace(/^sha256=/i, "").toLowerCase();

    // Timing-safe compare
    const timingSafeEqual = (a: string, b: string): boolean => {
      if (a.length !== b.length) return false;
      let result = 0;
      for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
      }
      return result === 0;
    };

    if (!provided || !timingSafeEqual(provided, expected)) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error("Invalid JSON body");
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Webhook received:", JSON.stringify(body));

    // Extract payment info from InfinitePay webhook payload
    // InfinitePay sends: id, status, amount, customer email, etc.
    const paymentId = (body.id || body.payment_id || body.transaction_id || "") as string;
    const status = (body.status || "") as string;
    const amount = body.amount as number | undefined;
    
    // Try to get customer email from various possible fields
    const customerEmail = (
      body.customer_email || 
      body.email || 
      (body.customer as Record<string, unknown>)?.email ||
      (body.payer as Record<string, unknown>)?.email ||
      ""
    ) as string;

    // Only process approved/paid payments
    const approvedStatuses = ["approved", "paid", "confirmed", "captured", "complete", "completed"];
    if (!approvedStatuses.includes(status.toLowerCase())) {
      console.log(`Payment status "${status}" is not approved, skipping`);
      return new Response(JSON.stringify({ received: true, processed: false, reason: "status_not_approved" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!paymentId) {
      console.error("No payment ID in webhook payload");
      return new Response(JSON.stringify({ error: "Missing payment ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Call the confirm_payment_webhook RPC
    const { data, error } = await supabaseAdmin.rpc("confirm_payment_webhook", {
      p_payment_provider_id: paymentId,
      p_user_email: customerEmail || null,
      p_amount: amount || null,
    });

    if (error) {
      console.error("Error confirming payment:", error);
      return new Response(JSON.stringify({ error: "Failed to process payment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Payment confirmation result:", JSON.stringify(data));

    // If payment was confirmed, also complete the upgrade
    if (data?.success && data?.user_id) {
      // Auto-complete the payment by calling verify_and_complete_payment
      // Find the CSRF token for this payment
      const { data: pendingPayment } = await supabaseAdmin
        .from("pending_payments")
        .select("csrf_token")
        .eq("user_id", data.user_id)
        .eq("status", "confirmed_by_webhook")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (pendingPayment?.csrf_token) {
        const { data: verifyResult, error: verifyError } = await supabaseAdmin.rpc(
          "verify_and_complete_payment",
          { p_csrf_token: pendingPayment.csrf_token }
        );

        if (verifyError) {
          console.error("Error completing payment:", verifyError);
        } else {
          console.log("Payment completed:", JSON.stringify(verifyResult));
        }
      }
    }

    return new Response(JSON.stringify({ received: true, processed: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
