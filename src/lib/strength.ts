import type { StrengthParseResult, StrengthExercise } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export async function parseStrengthWorkout(
  description: string,
  history?: StrengthExercise[],
): Promise<StrengthParseResult> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/strength`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ description, history }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error')
    throw new Error(`Strength parsing failed: ${err}`)
  }

  return res.json() as Promise<StrengthParseResult>
}
