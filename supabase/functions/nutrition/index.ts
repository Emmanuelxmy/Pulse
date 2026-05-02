import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const SYSTEM_PROMPT = `You are a nutrition expert and dietician. Given a natural-language description of a meal, estimate the macronutrients as accurately as possible using standard food databases.

Rules:
- Use realistic portion sizes if not specified
- Be conservative: don't over-estimate
- For homemade food, use typical recipe values
- For restaurant food, use average values for that dish
- Classify quality: "high" = whole foods, mostly protein+veg; "moderate" = mixed, some processed; "low" = fast food, highly processed, mostly refined carbs/fat

Respond ONLY with valid JSON in this exact shape, no markdown, no explanation outside the JSON:
{
  "foods": ["specific item 1 with portion", "item 2 with portion"],
  "protein_g": 0,
  "carbs_g": 0,
  "fat_g": 0,
  "calories": 0,
  "quality": "high" | "moderate" | "low",
  "meal_type": "breakfast" | "lunch" | "dinner" | "snack",
  "reasoning": "brief 1-sentence explanation of key estimates"
}`

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS })
  }

  try {
    const { description } = await req.json()

    if (!description || typeof description !== "string") {
      return new Response(JSON.stringify({ error: "description required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      })
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Meal description: ${description}` }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(JSON.stringify({ error: err }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      })
    }

    const data = await res.json()
    const text: string = data.content[0].text

    let estimate
    try {
      estimate = JSON.parse(text)
    } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      estimate = JSON.parse(match ? match[1] : text)
    }

    return new Response(JSON.stringify(estimate), {
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  }
})
