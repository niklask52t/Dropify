# Dropify

**Track every release from your favorite Spotify artists — in one place.**

A production-ready web app for tracking Spotify artist releases. Multiple users can log in with Spotify, track artists, and see all releases in a central dashboard with a calendar view, filters, and push/email notifications.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (PostgreSQL + RLS) |
| Spotify data | Spotify Client Credentials API |
| Email | Resend |
| Push | web-push (VAPID) |
| Cron | Vercel Cron Jobs |
| Deploy | Vercel |

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/niklask52t/Dropify
cd Dropify
npm install
```

### 2. Supabase setup

1. Create a project at https://supabase.com
2. In the SQL editor, run the full contents of `supabase/migrations/001_schema.sql`
3. Go to **Auth > Providers > Spotify** and enable it
4. Add your Spotify Client ID + Secret to Supabase Auth
5. Set the redirect URL to: `https://yourdomain.com/auth/callback`

### 3. Spotify App

1. Create an app at https://developer.spotify.com/dashboard
2. Add redirect URI: `https://yourdomain.com/auth/callback`
3. Copy Client ID and Client Secret

### 4. Environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

NEXT_PUBLIC_APP_URL=http://localhost:3000

APP_ACCESS_MODE=public
ALLOWED_SPOTIFY_USER_IDS=id1,id2
ALLOWED_EMAILS=you@example.com

RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=Dropify <noreply@yourdomain.com>

NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:your@email.com

CRON_SECRET=random_secure_string
```

**Generate VAPID keys:**
```bash
npx web-push generate-vapid-keys
```

### 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000

---

## Deployment (Vercel)

```bash
npm i -g vercel
vercel --prod
```

Set all env vars in Vercel project settings. The daily sync cron at 08:00 UTC is in `vercel.json`.

---

## Features

- Spotify OAuth login, profile save, logout
- Private/public access mode with allowlist (Spotify ID or email)
- Artist search with debounce — artist cards with image, genres, popularity, followers
- Per-user artist watchlist, no duplicates, instant remove
- Release sync: albums, singles, EPs, compilations, appears_on
- Dashboard with filters (artist / type / date range / text search)
- Monthly calendar view — click a day to see releases
- Daily cron sync + manual sync button
- Email notifications via Resend
- Browser push notifications via VAPID
- Per-user notification settings (email/push on/off)
- Row Level Security — users only see their own data
- Releases and artists are globally cached (shared)
- Responsive + dark mode

---

## Project Structure

```
src/
  app/
    (app)/dashboard/      Release feed with filters
    (app)/artists/        Search + watchlist management
    (app)/calendar/       Monthly calendar view
    (app)/settings/       Account, notifications, watchlist
    api/artists/search/   GET  — Spotify artist search
    api/artists/track/    POST/DELETE — track/untrack artist
    api/watchlist/        GET  — user's watchlist
    api/releases/         GET  — filtered releases
    api/sync/             POST — manual sync
    api/cron/sync/        GET  — Vercel cron endpoint
    api/notifications/    GET/PATCH settings, POST/DELETE push sub
    auth/callback/        Supabase OAuth callback
    login/                Login page
    access-denied/        Private mode denial
  lib/
    supabase/client.ts    Browser client
    supabase/server.ts    Server + service role client
    spotify.ts            Client Credentials API helper
    sync.ts               Sync logic + notification dispatch
    email.ts              Resend email service
    push.ts               web-push service
    access-control.ts     Allowlist check
  middleware.ts           Auth guard + access control
  types/index.ts          All TypeScript types
supabase/migrations/001_schema.sql   Full schema + RLS + trigger
public/sw.js             Service Worker for push notifications
vercel.json              Cron schedule (daily 08:00 UTC)
```

---

## Access Control

Set `APP_ACCESS_MODE=private` and configure:
- `ALLOWED_SPOTIFY_USER_IDS` — comma-separated Spotify user IDs
- `ALLOWED_EMAILS` — comma-separated email addresses

Find your Spotify ID at: https://www.spotify.com/account/overview/

---

## Sync Architecture

- **On track**: new artist tracked -> immediate sync (fire & forget)
- **Manual**: TopBar sync button -> full sync
- **Daily cron**: Vercel calls `/api/cron/sync` at 08:00 UTC
- **Dedup**: upsert by `spotify_id` -> no duplicates ever
- **Notifications**: after sync, new releases in past 25h trigger email/push once per user per release (tracked in `notifications_sent`)

---

## Security

- Spotify secrets never exposed to the client
- Service role key only server-side (sync/cron)
- RLS: users read/write only their own data
- Cron endpoint: `Authorization: Bearer CRON_SECRET`
- Access control: middleware + OAuth callback
