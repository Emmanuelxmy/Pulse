import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const SYSTEM_PROMPT = `You are a strength training parser. Given a freeform workout description, extract each exercise into structured data and provide a progression recommendation for the next session.

Rules:
- Parse exercise names, sets, reps, and weight from natural language
- Handle common formats: "Bench 135x5x3", "3x10 curls at 35", "Squats 225 5 sets of 3", "OHP 95 lbs 4x8"
- Normalize exercise names to standard form (e.g., "bench" → "Bench Press", "OHP" → "Overhead Press", "deads" → "Deadlift")
- If weight unit isn't specified, assume lbs
- If sets/reps aren't clear, make a reasonable assumption and note it
- For progression: recommend small increments (5 lbs upper body, 10 lbs lower body) or rep increases based on the current numbers
- If history is provided, factor it into progression recommendations

Respond ONLY with valid JSON in this exact shape, no markdown, no explanation outside the JSON:
{
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": 3,
      "reps": 5,
      "weight_lbs": 135,
      "notes": "optional note"
    }
  ],
  "progression": "Brief next-session recommendation based on the exercises logged"
}`

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS })
  }

  try {
    const { description, history } = await req.json()

    if (!description || typeof description !== "string") {
      return new Response(JSON.stringify({ error: "description required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      })
    }

    let userContent = `Workout description: ${description}`
    if (history && Array.isArray(history) && history.length > 0) {
      userContent += `\n\nRecent history for these exercises:\n${JSON.stringify(history, null, 2)}`
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
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
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

    let result
    try {
      result = JSON.parse(text)
    } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      result = JSON.parse(match ? match[1] : text)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  }
})
