import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_PASSWORD = "preciart123@";

interface CaktoPayload {
  status: string;
  customer: {
    email: string;
    name?: string;
  };
  product?: {
    name?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const payload: CaktoPayload = await req.json();
    console.log("Webhook received:", JSON.stringify(payload));

    // Verificar se o status é "paid"
    if (payload.status !== "paid") {
      console.log("Payment status is not 'paid', ignoring webhook");
      return new Response(
        JSON.stringify({ message: "Ignored - status is not paid" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const email = payload.customer?.email?.toLowerCase().trim();
    const name = payload.customer?.name || "";

    if (!email) {
      console.error("No email provided in webhook payload");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verificar se usuário já existe na tabela users
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      console.log("User already exists:", email);
      return new Response(
        JSON.stringify({ message: "User already exists" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Criar registro na tabela users usando função segura com SECURITY DEFINER
    const { error: userError } = await supabase
      .rpc("create_webhook_user", {
        p_user_id: authData.user.id,
        p_email: email,
        p_name: name || null,
      });

    if (userError) {
      console.error("Error creating user record:", userError);
      // Tentar deletar o auth user se falhou a criação do registro
      await supabase.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: "Failed to create user record" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Enviar email de boas-vindas
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        const appUrl = Deno.env.get("APP_URL") || "https://preciart-estimator.lovable.app";
        
        await resend.emails.send({
          from: "PreciGraf <onboarding@resend.dev>",
          to: [email],
          subject: "Seu acesso ao PreciGraf foi liberado 🚀",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Olá${name ? `, ${name}` : ""}!</h1>
              
              <p style="color: #666; font-size: 16px;">
                Seu acesso ao <strong>PreciGraf</strong> foi liberado com sucesso.
              </p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">Dados de acesso:</h3>
                <p style="margin: 5px 0;"><strong>Login:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>Senha temporária:</strong> ${DEFAULT_PASSWORD}</p>
              </div>
              
              <p style="color: #666; font-size: 16px;">
                Acesse em:<br>
                <a href="${appUrl}" style="color: #0066cc;">${appUrl}</a>
              </p>
              
              <p style="color: #ff6600; font-size: 14px; font-weight: bold;">
                ⚠️ Por segurança, no primeiro acesso você será obrigado a criar uma nova senha.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px;">
                Atenciosamente,<br>
                Equipe PreciGraf
              </p>
            </div>
          `,
        });
        
        console.log("Welcome email sent to:", email);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Não falhar o webhook se o email não foi enviado
      }
    }

    console.log("User created successfully:", email);
    return new Response(
      JSON.stringify({ success: true, message: "User created successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
