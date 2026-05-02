# Pulse

A personal life command center — installable PWA for tracking training, nutrition, tasks, and habits with an AI coach that reads your schedule.

---

## What it does

Pulse gives you a single place to log everything that matters in a day and get a twice-daily AI brief on what to do next.

**Today** — one-tap entry for workouts, meals, tasks, and habits. Progress ring shows how complete your day is. Protein bar tracks `eaten / goal` in real time.

**Coach** — Claude generates a Morning Brief (6 AM) and Evening Brief (6 PM) based on what you've logged, your week of training, and your Google Calendar. It suggests optimal training windows, flags recovery needs, and surfaces what to prioritise.

**Dashboard** — weekly zone split donut, 7-day protein bar chart, habit completion grid, and session stats.

**Settings** — HR zones, protein target, training phase, habits list, task categories, and Google Calendar connect / disconnect.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS v4 |
| Routing | React Router v6 |
| Charts | Recharts |
| Icons | Lucide React |
| Local storage | IndexedDB via `idb` |
| Remote DB | Supabase (Postgres) |
| AI | Anthropic Claude via Supabase Edge Function |
| Calendar | Google Calendar API v3 (GIS implicit flow) |
| PWA | vite-plugin-pwa + Workbox |

---

## Project structure

```
src/
├── components/
│   ├── coach/          CoachView, CoachCard
│   ├── dashboard/      DashboardView, ZoneSplit, ProteinTracker, HabitGrid, WeekSummary
│   ├── layout/         Shell, BottomNav
│   ├── settings/       SettingsView
│   └── today/          TodayView, QuickEntry, EntryFeed, EntryModal
│                       TrainingEntry, NutritionEntry, TaskEntry, HabitChecklist
├── hooks/
│   ├── useEntries.ts   CRUD — IDB first, Supabase in background
│   ├── useToday.ts     Aggregates protein total, zone split, task %, overall progress
│   ├── useCoach.ts     Twice-daily trigger, 2-hour manual refresh gate
│   ├── useSettings.ts  Settings from IDB + Supabase
│   └── useSync.ts      Online/offline detection, sync on reconnect
├── lib/
│   ├── db.ts           IndexedDB schema (entries, coach_cache, settings_cache)
│   ├── sync.ts         Push unsynced entries, pull from Supabase
│   ├── coach.ts        Claude API wrapper with session-window caching
│   ├── calendar.ts     Google Calendar OAuth + CRUD + getUpcomingEvents
│   ├── supabase.ts     Supabase client (graceful fallback if unconfigured)
│   └── utils.ts        Zone classification, date helpers, week range
├── types/index.ts      All shared TypeScript types
└── styles/globals.css  Tailwind directives + CSS variables

supabase/
└── functions/
    └── coach/
        └── index.ts    Deno edge function — calls Claude with today + week data + calendar
```

---

## Environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

The Anthropic API key lives **server-side only** — set it as a Supabase Edge Function secret:

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

---

## Local development

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`. The service worker is disabled in dev mode — PWA features only activate in the production build.

---

## Deployment

### Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL schema (creates `entries`, `settings`, `coach_responses` tables)
3. Deploy the edge function:
   ```bash
   supabase functions deploy coach
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```

### Vercel

```bash
npx vercel --prod
```

Set the three `VITE_*` environment variables in the Vercel dashboard or via CLI:

```bash
npx vercel env add VITE_SUPABASE_URL
npx vercel env add VITE_SUPABASE_ANON_KEY
npx vercel env add VITE_GOOGLE_CLIENT_ID
```

### Google Calendar

1. Create an OAuth 2.0 client ID at [console.cloud.google.com](https://console.cloud.google.com) (Web application type)
2. Add your Vercel domain to **Authorized JavaScript origins**
3. The app uses the GIS implicit flow — no client secret is needed in the frontend

---

## Installing as a PWA

**iPhone (Safari):** Open the deployed URL → share button → "Add to Home Screen"

**Android (Chrome):** Open the URL → browser menu → "Add to Home Screen" (or wait for the install banner)

The app installs as a standalone app with no browser chrome. All entries are written to IndexedDB first so the app works fully offline. Data syncs to Supabase automatically when you reconnect.

---

## Coach AI

The AI brief runs **twice per day**:

- **Morning Brief** — triggered on first app open between 6 AM and 6 PM
- **Evening Brief** — triggered on first app open between 6 PM and 6 AM

Claude receives your today's log, the past week of entries, your settings (HR zones, protein target, training phase), and your next 7 days of Google Calendar events. It returns a summary and a prioritised list of recommendations.

Manual refresh is available but gated to once every 2 hours to avoid unnecessary API usage.

---

## Data model

All entries share a single `entries` table with a `domain` field and a JSONB `data` field:

```
domain: 'training' | 'nutrition' | 'task' | 'habit'
data:   TrainingData | NutritionData | TaskData | HabitData
```

Tasks optionally carry a `gcal_event_id` — if set, completing or editing the task syncs the change to Google Calendar automatically.

---

Built by Emmanuel — Katalyst Inc.
