import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { description, categories } = await req.json();
    if (!description || typeof description !== "string") {
      return new Response(JSON.stringify({ error: "description is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const list: string[] = Array.isArray(categories) && categories.length
      ? categories
      : ["operational", "materials", "labor", "marketing", "tax", "other"];

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você categoriza despesas de gráfica. Responda SOMENTE com o nome de UMA categoria da lista fornecida, sem explicações.",
          },
          {
            role: "user",
            content: `Descrição: "${description}"\nCategorias: ${list.join(", ")}\nResponda apenas o nome exato da categoria.`,
          },
        ],
        temperature: 0,
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Limite de uso atingido" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) throw new Error(`AI error ${resp.status}`);

    const data = await resp.json();
    const raw = (data?.choices?.[0]?.message?.content || "").trim().toLowerCase();
    const suggestion = list.find((c) => raw.includes(c.toLowerCase())) || list[0];

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
