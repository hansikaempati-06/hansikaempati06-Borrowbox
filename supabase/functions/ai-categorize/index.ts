// BorrowBox AI Category Suggestion Edge Function
// Receives a resource name and description, asks OpenAI to pick the best
// category from the predefined list, and returns the suggestion.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CATEGORIES = ["Books", "Calculators", "Electronics", "Lab Equipment", "Stationery", "Study Materials", "Other"];

const SYSTEM_PROMPT = `You are a category classification assistant for BorrowBox, a campus resource-sharing platform.

Given a resource name and description, choose the single best category from this exact list:
${CATEGORIES.join(", ")}

Return JSON in exactly this format:
{ "category": "<one of the categories above>", "confidence": "high|medium|low" }

Only return a category from the provided list. Do not invent new categories.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { name, description } = await req.json();

    if (!name || typeof name !== "string") {
      return new Response(
        JSON.stringify({ error: "Resource name is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "AI service is not configured.", aiUnavailable: true }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `Resource name: ${name.trim()}
Description: ${(description || "").trim()}

What is the best category for this resource?`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI API error:", openaiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "The AI service returned an error.", aiUnavailable: true }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const rawContent = openaiData.choices?.[0]?.message?.content || "";

    let parsed: { category?: string; confidence?: string };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return new Response(
        JSON.stringify({ error: "The AI returned an unexpected format.", aiUnavailable: true }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the returned category is in our allowed list
    const category = CATEGORIES.includes(parsed.category || "")
      ? parsed.category!
      : "Other";

    return new Response(
      JSON.stringify({ category, confidence: parsed.confidence || "medium" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
