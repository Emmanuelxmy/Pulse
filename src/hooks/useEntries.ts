import { useState, useEffect, useCallback } from 'react'
import {
  getEntriesByDate,
  saveEntry,
  updateEntry,
  deleteEntry,
} from '@/lib/db'
import { syncUnsynced } from '@/lib/sync'
import { generateId, getTodayISO } from '@/lib/utils'
import type { Entry, DomainType, EntryData } from '@/types'

export function useEntries(date: string) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getEntriesByDate(date)
    data.sort((a, b) => b.created_at.localeCompare(a.created_at))
    setEntries(data)
    setLoading(false)
  }, [date])

  useEffect(() => { load() }, [load])

  const add = useCallback(async (domain: DomainType, data: EntryData) => {
    const entry: Entry = {
      id: generateId(),
      created_at: new Date().toISOString(),
      date: getTodayISO(),
      domain,
      data,
      synced: false,
    }
    // Optimistic update
    setEntries(prev => [entry, ...prev])
    await saveEntry(entry)
    // Fire-and-forget sync
    syncUnsynced().catch(() => {})
    return entry
  }, [])

  const update = useCallback(async (entry: Entry) => {
    setEntries(prev => prev.map(e => (e.id === entry.id ? entry : e)))
    await updateEntry({ ...entry, synced: false })
    syncUnsynced().catch(() => {})
  }, [])

  const remove = useCallback(async (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
    await deleteEntry(id)
  }, [])

  return { entries, loading, add, update, remove, reload: load }
}
