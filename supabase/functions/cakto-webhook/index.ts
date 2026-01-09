import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse the webhook payload
    const payload: CaktoPayload = await req.json();
    console.log("Received webhook payload:", JSON.stringify(payload));

    // Validate payment status
    if (payload.status !== "paid") {
      console.log("Payment not approved, status:", payload.status);
      return new Response(
        JSON.stringify({ message: "Payment not approved" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Extract customer email
    const email = payload.customer?.email?.toLowerCase();
    const name = payload.customer?.name || null;

    if (!email) {
      console.error("No customer email provided");
      return new Response(
        JSON.stringify({ error: "Customer email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
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

    // Default password
    const defaultPassword = "preciart123@";

    // Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Auth user created:", authData.user.id);

    // Create user in our users table using the RPC function
    const { data: userId, error: userError } = await supabase.rpc("create_webhook_user", {
      p_user_id: authData.user.id,
      p_email: email,
      p_name: name,
    });

    if (userError) {
      console.error("Error creating user in users table:", userError);
      // Rollback: delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: "Failed to create user record" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("User record created:", userId);

    // Send welcome email with access credentials
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        await resend.emails.send({
          from: "PreciGraf <onboarding@resend.dev>",
          to: [email],
          subject: "Seu acesso ao PreciGraf foi liberado 🚀",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #000; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .credentials { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee; }
                .credentials p { margin: 10px 0; }
                .credentials strong { color: #000; }
                .button { display: inline-block; background: #000; color: #fff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">PreciGraf</h1>
                  <p style="margin: 10px 0 0 0;">Calculadora de Precificação Gráfica</p>
                </div>
                <div class="content">
                  <h2>Olá${name ? `, ${name}` : ''}!</h2>
                  <p>Seu acesso ao <strong>PreciGraf</strong> foi liberado com sucesso.</p>
                  
                  <div class="credentials">
                    <p><strong>Dados de Acesso:</strong></p>
                    <p>📧 <strong>Login:</strong> ${email}</p>
                    <p>🔐 <strong>Senha temporária:</strong> preciart123@</p>
                  </div>
                  
                  <p>Acesse agora:</p>
                  <a href="https://precigraf.com.br" class="button">Acessar PreciGraf</a>
                  
                  <div class="warning">
                    <strong>⚠️ Importante:</strong> Por segurança, no primeiro acesso você será obrigado a criar uma nova senha.
                  </div>
                </div>
                <div class="footer">
                  <p>Atenciosamente,<br><strong>Equipe PreciGraf</strong></p>
                  <p style="font-size: 12px; color: #999;">Este é um email automático, por favor não responda.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        console.log("Welcome email sent to:", email);
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Don't fail the webhook if email fails - user is already created
      }
    } else {
      console.warn("RESEND_API_KEY not configured, skipping welcome email");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User created successfully",
        userId: userId 
      }),
      { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
