import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const SYSTEM_PROMPT = `You are a direct, no-BS personal fitness coach. You help athletes optimize their training, nutrition, and strength work.

Context about the athlete will be provided (body stats, goals, recent training, nutrition, and strength data). Use this data to give specific, data-driven recommendations.

Key principles:
- Polarized training: 80% Zone 1, 20% high intensity. Avoid Zone 2 when possible.
- Track progressive overload for strength exercises.
- Factor in the athlete's body stats (height, weight, age) for proportional recommendations.
- Reference their active goals and progress toward them.
- Account for timing — morning briefs should focus on the day ahead, evening briefs on recovery and tomorrow's plan.

Your job: give specific, actionable recommendations for right now. Be brief and direct. No fluff. Use the actual numbers from their data. If they're behind on goals, say so clearly. If they're on track, acknowledge briefly and move on.

IMPORTANT: Respond ONLY with valid JSON in this exact shape:
{
  "summary": "2-3 sentence overall assessment",
  "recommendations": [
    {
      "category": "training" | "nutrition" | "strength" | "goal",
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
    const { today_entries, week_entries, strength_entries, goals, body_stats, settings, session } = await req.json()

    let userContent = `Session: ${session === "morning" ? "Morning brief" : "Evening brief"}

Today's entries: ${JSON.stringify(today_entries, null, 2)}

This week's entries: ${JSON.stringify(week_entries, null, 2)}

Current settings: ${JSON.stringify(settings, null, 2)}`

    if (strength_entries && strength_entries.length > 0) {
      userContent += `\n\nRecent strength sessions (last 14 days): ${JSON.stringify(strength_entries, null, 2)}`
    }

    if (goals && goals.length > 0) {
      userContent += `\n\nActive goals: ${JSON.stringify(goals, null, 2)}`
    }

    if (body_stats) {
      userContent += `\n\nBody stats: ${JSON.stringify(body_stats, null, 2)}`
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
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

    let recommendations
    try {
      recommendations = JSON.parse(text)
    } catch {
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
