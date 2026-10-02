// BorrowBox AI Recommendation Edge Function
// This function receives a student's natural-language requirement,
// fetches currently available resources from the Supabase database,
// constructs a structured prompt, calls OpenAI, validates the response,
// and returns recommendations that reference only real, available resources.

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are BorrowBox AI, an assistant for a college resource-sharing platform.

Your job is to understand a student's requirement and recommend suitable resources from the provided AVAILABLE RESOURCE LIST.

IMPORTANT RULES:
1. Recommend only resources present in the provided list.
2. Never invent a resource.
3. Never recommend unavailable resources.
4. Match resources based on the student's requirement, description, category, and usefulness.
5. Explain briefly why each recommended resource is relevant.
6. Return structured JSON.
7. If there is no suitable resource, clearly say that no matching resource is currently available.
8. Do not create fake resource IDs or names.

Return JSON in exactly this format:
{
  "recommendations": [
    {
      "resource_id": "<id from the list>",
      "reason": "Brief explanation of why this resource is relevant"
    }
  ],
  "message": "A helpful message for the student"
}

If no resources match, return:
{
  "recommendations": [],
  "message": "No suitable resources are currently available."
}`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { requirement } = await req.json();

    if (!requirement || typeof requirement !== "string" || requirement.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "A requirement string is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Step 1: Fetch currently available resources from the database ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: availableResources, error: dbError } = await supabase
      .from("resources")
      .select("id, name, category, description, condition")
      .eq("availability_status", "Available")
      .order("created_at", { ascending: false });

    if (dbError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch resources from database." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Step 2: If no resources are available, return early ---
    if (!availableResources || availableResources.length === 0) {
      return new Response(
        JSON.stringify({
          recommendations: [],
          message: "No resources are currently available in BorrowBox.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Step 3: Construct the prompt with the available resource list ---
    const resourceList = availableResources.map((r: any) =>
      `ID: ${r.id} | Name: ${r.name} | Category: ${r.category} | Condition: ${r.condition} | Description: ${r.description}`
    ).join("\n");

    const userPrompt = `Student's requirement: ${requirement.trim()}

AVAILABLE RESOURCE LIST:
${resourceList}

Recommend the most relevant resources from the list above. Return only valid JSON.`;

    // --- Step 4: Call the OpenAI API ---
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          error: "AI service is not configured. Please set the OPENAI_API_KEY secret.",
          aiUnavailable: true,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI API error:", openaiResponse.status, errText);
      return new Response(
        JSON.stringify({
          error: "The AI service returned an error. Please try again later.",
          aiUnavailable: true,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const rawContent = openaiData.choices?.[0]?.message?.content || "";

    // --- Step 5: Parse and validate the AI JSON response ---
    let parsed: { recommendations?: Array<{ resource_id: string; reason: string }>; message?: string };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return new Response(
        JSON.stringify({
          error: "The AI returned an unexpected response format. Please try again.",
          aiUnavailable: true,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Step 6: Validate that recommended resource IDs actually exist and are available ---
    const validIds = new Set(availableResources.map((r: any) => r.id));
    const validatedRecommendations = (parsed.recommendations || []).filter(
      (rec) => rec.resource_id && validIds.has(rec.resource_id)
    );

    // Attach full resource details for the frontend
    const enriched = validatedRecommendations.map((rec) => {
      const resource = availableResources.find((r: any) => r.id === rec.resource_id);
      return { ...rec, resource };
    });

    const message = parsed.message || (enriched.length === 0
      ? "No suitable resources are currently available."
      : "Here are my recommendations.");

    return new Response(
      JSON.stringify({ recommendations: enriched, message }),
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
