// Scheduled reminder — called by pg_cron or Supabase scheduled jobs
// Reads the stored push subscription and fires the right notification
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const MESSAGES = {
  morning: {
    title: "☀️ Morning Brief ready",
    body: "Your AI coach has your plan for the day.",
    url: "/coach",
  },
  evening: {
    title: "🌙 Evening Brief ready",
    body: "Review your day and plan tomorrow.",
    url: "/coach",
  },
  habits: {
    title: "✓ Habit check",
    body: "Don't forget to log your habits before bed.",
    url: "/",
  },
  protein: {
    title: "🥩 Protein check",
    body: "Halfway through the day — are you on track?",
    url: "/",
  },
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })

  try {
    const { type } = await req.json() as { type: keyof typeof MESSAGES }
    const msg = MESSAGES[type]
    if (!msg) return new Response(JSON.stringify({ error: "unknown type" }), { status: 400, headers: CORS })

    // Look up stored subscription
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )
    const { data } = await supabase
      .from("push_subscriptions")
      .select("subscription, preferences")
      .eq("id", "default")
      .single()

    if (!data?.subscription) {
      return new Response(JSON.stringify({ ok: true, skipped: "no subscription" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      })
    }

    // Check if this notification type is enabled
    const prefs = data.preferences ?? {}
    if (prefs[type] === false) {
      return new Response(JSON.stringify({ ok: true, skipped: "disabled" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      })
    }

    // Call the push function
    const pushUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/push`
    const res = await fetch(pushUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify({ subscription: data.subscription, ...msg }),
    })

    return new Response(JSON.stringify({ ok: res.ok }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  }
})
