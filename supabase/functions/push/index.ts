// Web Push sender — signs the request with VAPID and delivers to the browser's push service
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @deno-types="npm:@types/web-push"
import webPush from "npm:web-push@3.6.7"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })

  try {
    const vapidPublic  = Deno.env.get("VAPID_PUBLIC_KEY")!
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")!

    webPush.setVapidDetails("mailto:pulse@app.local", vapidPublic, vapidPrivate)

    const { subscription, title, body, url, icon } = await req.json()

    await webPush.sendNotification(
      subscription,
      JSON.stringify({ title, body, url: url ?? "/", icon: icon ?? "/icons/icon-192.png" }),
    )

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  }
})
