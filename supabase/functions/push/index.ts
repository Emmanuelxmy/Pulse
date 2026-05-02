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

    webPush.setVapidDetails("https://pulse-six-azure.vercel.app", vapidPublic, vapidPrivate)

    const { subscription, title, body, url, icon } = await req.json()

    await webPush.sendNotification(
      subscription,
      JSON.stringify({ title, body, url: url ?? "/", icon: icon ?? "/icons/icon-192.png" }),
    )

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  } catch (e: unknown) {
    const detail = e && typeof e === "object"
      ? { message: String((e as {message?:unknown}).message ?? e), statusCode: (e as {statusCode?:unknown}).statusCode, body: (e as {body?:unknown}).body }
      : { message: String(e) }
    return new Response(JSON.stringify({ error: detail }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  }
})
