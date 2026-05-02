import { supabase } from '@/lib/supabase'
import {
  getUnsyncedEntries,
  markEntrySynced,
  saveEntry,
  getSettings,
  saveSettings,
} from '@/lib/db'
import { DEFAULT_SETTINGS } from '@/types'
import type { Entry, Settings } from '@/types'

export async function syncUnsynced(): Promise<void> {
  const unsynced = await getUnsyncedEntries()
  if (!unsynced.length) return

  for (const entry of unsynced) {
    const { error } = await supabase.from('entries').upsert({
      id: entry.id,
      created_at: entry.created_at,
      date: entry.date,
      domain: entry.domain,
      data: entry.data,
      synced: true,
    })
    if (!error) {
      await markEntrySynced(entry.id)
    }
  }
}

export async function pullEntriesFromSupabase(start: string, end: string): Promise<void> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .gte('date', start)
    .lte('date', end)

  if (error || !data) return

  for (const row of data) {
    const entry: Entry = { ...(row as Entry), synced: true }
    await saveEntry(entry)
  }
}

export async function syncSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 1)
    .single()

  if (error || !data) {
    const local = await getSettings()
    return local ?? DEFAULT_SETTINGS
  }

  const settings = data.data as Settings
  await saveSettings(settings)
  return settings
}

export async function pushSettings(settings: Settings): Promise<void> {
  await saveSettings(settings)
  await supabase
    .from('settings')
    .upsert({ id: 1, data: settings, updated_at: new Date().toISOString() })
}
