import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const SYSTEM_PROMPT = `You are a direct, no-BS personal coach for a 17-year-old competitive cross-country skier in off-season training.

Key facts about the athlete:
- Polarized training: 80% Zone 1 (HR < 152 bpm), 20% high intensity (HR > 165 bpm). Avoid Zone 2 (152–165).
- Max HR: 190 bpm. Resting HR: 42 bpm.
- Currently in Phase 1: 3 sessions/week target. Phase 2 (June) targets 4–5/week.
- Daily protein target: 140g with carb cycling.
- Must do lower back and shoulder prehab daily.
- Running a startup (Katalyst) and preparing for college in August.

Your job: give specific, data-driven recommendations for right now, training, nutrition, and tonight. Be brief and direct. No fluff. Use the actual numbers from their data. If they're behind, say so clearly. If they're on track, acknowledge briefly and move on.

IMPORTANT: Respond ONLY with valid JSON in this exact shape:
{
  "summary": "2–3 sentence overall assessment",
  "recommendations": [
    {
      "category": "training" | "nutrition" | "habit" | "task",
      "priority": "high" | "medium" | "low",
      "action": "specific thing to do",
      "reasoning": "why, with data"
    }
  ]
}`

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS })
  }

  try {
    const { today_entries, week_entries, settings, session } = await req.json()

    const userContent = `Session: ${session === "morning" ? "Morning brief" : "Evening brief"}

Today's entries: ${JSON.stringify(today_entries, null, 2)}

This week's entries: ${JSON.stringify(week_entries, null, 2)}

Current settings: ${JSON.stringify(settings, null, 2)}`

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
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

    // Parse and validate JSON response
    let recommendations
    try {
      recommendations = JSON.parse(text)
    } catch {
      // If Claude returned markdown-wrapped JSON, strip it
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      recommendations = JSON.parse(match ? match[1] : text)
    }

    return new Response(JSON.stringify(recommendations), {
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  }
})
