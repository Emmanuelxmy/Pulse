import type { MacroEstimate } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export async function estimateMacros(description: string): Promise<MacroEstimate> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/nutrition`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ description }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error')
    throw new Error(`Macro estimation failed: ${err}`)
  }

  return res.json() as Promise<MacroEstimate>
}
