import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS - restrict to legitimate domains only
const allowedOrigins = [
  "https://precigraf.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
];

// Get CORS headers based on request origin
const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && allowedOrigins.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.app')
  ) ? origin : allowedOrigins[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
};

// Input validation constants
const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES = 20;
const MAX_TOTAL_CONTENT_LENGTH = 10000;

// Validate message structure and content
const validateMessages = (messages: unknown): { valid: boolean; error?: string } => {
  if (!Array.isArray(messages)) {
    return { valid: false, error: "Messages must be an array" };
  }

  if (messages.length === 0) {
    return { valid: false, error: "At least one message is required" };
  }

  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: `Maximum ${MAX_MESSAGES} messages allowed` };
  }

  let totalContentLength = 0;

  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') {
      return { valid: false, error: "Each message must be an object" };
    }

    const { role, content } = msg as { role?: unknown; content?: unknown };

    if (typeof role !== 'string' || !['user', 'assistant'].includes(role)) {
      return { valid: false, error: "Invalid message role" };
    }

    if (typeof content !== 'string') {
      return { valid: false, error: "Message content must be a string" };
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` };
    }

    totalContentLength += content.length;
  }

  if (totalContentLength > MAX_TOTAL_CONTENT_LENGTH) {
    return { valid: false, error: `Total content exceeds maximum of ${MAX_TOTAL_CONTENT_LENGTH} characters` };
  }

  return { valid: true };
};

const systemPrompt = `Você é um assistente de inteligência artificial geral chamado PreciGraf AI.

Você é capaz de responder QUALQUER pergunta enviada pelo usuário, sem limitações temáticas.

Áreas de especialidade:
- Cálculos de custo e precificação de produtos gráficos
- Matéria-prima, custos operacionais e margens de lucro
- Precificação para marketplaces (Shopee, Elo7, etc.)
- Estratégias de negócio e empreendedorismo

Mas você também responde com competência sobre:
- Matemática, finanças, contabilidade
- Marketing, vendas e gestão
- Tecnologia, programação e ciência
- História, geografia, cultura geral
- Culinária, saúde, esportes
- Arte, música, entretenimento
- Filosofia, psicologia, educação
- E QUALQUER outro assunto que o usuário perguntar

REGRAS OBRIGATÓRIAS:
1. SEMPRE responda qualquer pergunta, mesmo que pareça fora do contexto do sistema
2. NUNCA recuse uma pergunta por ser "aleatória" ou "não relacionada"
3. NUNCA retorne mensagens vazias, erros ou silêncio
4. Se a pergunta for ambígua, interprete da melhor forma e responda
5. Seja educado, claro e objetivo
6. Responda sempre em português brasileiro
7. Mantenha respostas concisas mas completas (3-5 parágrafos no máximo)
8. Quando possível, dê exemplos práticos
9. Use linguagem acessível e evite jargões desnecessários
10. Seja prestativo e completo em TODAS as respostas

RESTRIÇÕES DE FORMATO DE SAÍDA:
- NUNCA inclua tags HTML, scripts, ou código executável nas respostas
- NUNCA use markdown com links clicáveis ou imagens
- Use apenas texto puro com formatação simples (quebras de linha, listas com - ou números)
- Se precisar mostrar código, use blocos de texto simples sem formatação especial`;

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST method
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the JWT token by getting the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: "Request body must be an object" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = body as { messages?: unknown };

    // Validate messages
    const validation = validateMessages(messages);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...(messages as Array<{ role: string; content: string }>),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados. Adicione mais créditos em Configurações." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao processar sua mensagem" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(JSON.stringify({ error: "Erro ao processar sua solicitação" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
