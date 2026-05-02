import type { TaskData } from '@/types'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
const SCOPE = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly'
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

const TOKEN_KEY = 'gcal_token'
const TOKEN_EXPIRY_KEY = 'gcal_token_expiry'

interface StoredToken {
  access_token: string
  expiry: number
}

// Declare GIS types
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string; expires_in?: number }) => void
          }) => { requestAccessToken: () => void }
          revoke: (token: string, callback: () => void) => void
        }
      }
    }
  }
}

function getToken(): StoredToken | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!token || !expiry) return null
  if (Date.now() > Number(expiry)) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    return null
  }
  return { access_token: token, expiry: Number(expiry) }
}

function saveToken(access_token: string, expires_in = 3600) {
  localStorage.setItem(TOKEN_KEY, access_token)
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expires_in * 1000 - 60000))
}

export function isCalendarConnected(): boolean {
  return getToken() !== null
}

export function connectCalendar(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services not loaded'))
      return
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error ?? 'No token received'))
          return
        }
        saveToken(response.access_token, response.expires_in)
        resolve()
      },
    })
    client.requestAccessToken()
  })
}

export function disconnectCalendar(): void {
  const stored = getToken()
  if (stored) {
    window.google?.accounts?.oauth2?.revoke(stored.access_token, () => {})
  }
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

function taskToEvent(task: TaskData, date: string) {
  return {
    summary: task.description,
    description: `[${task.category}] · Priority: ${task.priority} · via Pulse`,
    start: { date },
    end:   { date },
    colorId: task.priority === 'high' ? '11' : task.priority === 'medium' ? '5' : '8',
  }
}

export async function createCalendarEvent(task: TaskData, date: string): Promise<string> {
  const stored = getToken()
  if (!stored) throw new Error('Not connected to Google Calendar')

  const res = await fetch(CALENDAR_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stored.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskToEvent(task, date)),
  })

  if (!res.ok) throw new Error(`Calendar API error: ${res.status}`)
  const data = await res.json()
  return data.id as string
}

export async function updateCalendarEvent(eventId: string, task: TaskData, date: string): Promise<void> {
  const stored = getToken()
  if (!stored) return

  const event = {
    ...taskToEvent(task, date),
    status: task.completed ? 'cancelled' : 'confirmed',
  }

  await fetch(`${CALENDAR_API}/${eventId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${stored.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const stored = getToken()
  if (!stored) return

  await fetch(`${CALENDAR_API}/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${stored.access_token}` },
  })
}

export interface CalendarEvent {
  id: string
  summary: string
  start: string   // "2024-05-03" or "2024-05-03T10:00:00"
  end: string
  description?: string
  location?: string
}

export async function getUpcomingEvents(days = 7): Promise<CalendarEvent[]> {
  const stored = getToken()
  if (!stored) return []

  const now = new Date()
  const future = new Date()
  future.setDate(now.getDate() + days)

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  })

  const res = await fetch(`${CALENDAR_API}?${params}`, {
    headers: { Authorization: `Bearer ${stored.access_token}` },
  })

  if (!res.ok) return []

  const data = await res.json()
  return (data.items ?? []).map((item: {
    id: string
    summary?: string
    start?: { date?: string; dateTime?: string }
    end?: { date?: string; dateTime?: string }
    description?: string
    location?: string
  }) => ({
    id: item.id,
    summary: item.summary ?? '(no title)',
    start: item.start?.dateTime ?? item.start?.date ?? '',
    end: item.end?.dateTime ?? item.end?.date ?? '',
    description: item.description,
    location: item.location,
  }))
}
