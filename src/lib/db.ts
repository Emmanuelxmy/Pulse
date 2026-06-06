import { openDB, type IDBPDatabase } from 'idb'
import type { Entry, Settings, DomainType } from '@/types'

const DB_NAME = 'coach-db'
const DB_VERSION = 2

type PulseDB = {
  entries: {
    key: string
    value: Entry
    indexes: { 'by-date': string; 'by-domain-date': [string, string] }
  }
  coach_cache: {
    key: string
    value: { key: string; [k: string]: unknown }
  }
  settings_cache: {
    key: string
    value: { key: string; data: Settings }
  }
}

let _db: IDBPDatabase<PulseDB> | null = null

async function getDB(): Promise<IDBPDatabase<PulseDB>> {
  if (_db) return _db
  _db = await openDB<PulseDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('entries')) {
        const entries = db.createObjectStore('entries', { keyPath: 'id' })
        entries.createIndex('by-date', 'date')
        entries.createIndex('by-domain-date', ['domain', 'date'])
      }
      if (!db.objectStoreNames.contains('coach_cache')) {
        db.createObjectStore('coach_cache', { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains('settings_cache')) {
        db.createObjectStore('settings_cache', { keyPath: 'key' })
      }
    },
  })
  return _db
}

export async function getEntriesByDate(date: string): Promise<Entry[]> {
  const db = await getDB()
  return db.getAllFromIndex('entries', 'by-date', date)
}

export async function getEntriesByDateRange(start: string, end: string): Promise<Entry[]> {
  const db = await getDB()
  const all = await db.getAll('entries')
  return all.filter(e => e.date >= start && e.date <= end)
}

export async function saveEntry(entry: Entry): Promise<void> {
  const db = await getDB()
  await db.put('entries', entry)
}

export async function updateEntry(entry: Entry): Promise<void> {
  const db = await getDB()
  await db.put('entries', entry)
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('entries', id)
}

export async function getUnsyncedEntries(): Promise<Entry[]> {
  const db = await getDB()
  const all = await db.getAll('entries')
  return all.filter(e => !e.synced)
}

export async function markEntrySynced(id: string): Promise<void> {
  const db = await getDB()
  const entry = await db.get('entries', id)
  if (entry) {
    entry.synced = true
    await db.put('entries', entry)
  }
}

export async function getSettings(): Promise<Settings | null> {
  const db = await getDB()
  const row = await db.get('settings_cache', 'settings')
  return row ? row.data : null
}

export async function saveSettings(data: Settings): Promise<void> {
  const db = await getDB()
  await db.put('settings_cache', { key: 'settings', data })
}

export async function getEntriesByDomainAndDateRange(
  domain: DomainType, start: string, end: string,
): Promise<Entry[]> {
  const db = await getDB()
  const all = await db.getAll('entries')
  return all.filter(e => e.domain === domain && e.date >= start && e.date <= end)
}

export async function clearAllData(): Promise<void> {
  const db = await getDB()
  await db.clear('entries')
  await db.clear('coach_cache')
  await db.clear('settings_cache')
}
