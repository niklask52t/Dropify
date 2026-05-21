# Dropify

**Track every release from your favorite Spotify artists — in one place.**

A production-ready web app for tracking Spotify artist releases. Multiple users can log in with their Spotify account, track artists, and see all releases in a central dashboard with calendar view, filters, and push/email notifications. All data is stored **locally in your own PostgreSQL database** — no cloud service required.

![Dropify](public/logo-full.png)

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Quick Start (Local)](#quick-start-local)
4. [Spotify Developer App Setup](#spotify-developer-app-setup)
5. [Database Setup (PostgreSQL + Prisma)](#database-setup-postgresql--prisma)
6. [Environment Variables](#environment-variables)
7. [Production Deployment on Debian 13](#production-deployment-on-debian-13)
8. [Access Control](#access-control)
9. [Architecture](#architecture)
10. [Changelog](#changelog)

---

## Features

| Feature | Details |
|---|---|
| **Spotify OAuth Login** | Sign in with Spotify via NextAuth.js, profile sync, logout |
| **Access Control** | Private or public mode, allowlist by Spotify ID or email |
| **Artist Search** | Debounced global search, artist cards with image, genres, popularity, followers |
| **Watchlist** | Per-user tracked artists, no duplicates, instant remove |
| **Release Sync** | Albums, Singles, EPs, Compilations, Appears On |
| **Dashboard** | All releases from tracked artists, filters: artist / type / date / search |
| **Calendar** | Monthly calendar with per-day release drill-down |
| **Auto Sync** | Daily cron (08:00 UTC via Vercel or system cron) + manual trigger |
| **Email Notifications** | New release emails via Resend (HTML template) |
| **Push Notifications** | Browser push via VAPID / web-push |
| **Settings** | Account info, notification prefs, watchlist management |
| **Security** | Application-layer access control, Spotify secrets server-side only |
| **Responsive** | Dark theme, works on all screen sizes |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 6 |
| Styling | Tailwind CSS 4 |
| Auth | NextAuth.js v4 + Spotify OAuth Provider |
| Database | PostgreSQL + Prisma ORM v6 |
| Spotify Data | Spotify Client Credentials API |
| Email | Resend v6 |
| Push | web-push (VAPID) |
| Cron | Vercel Cron Jobs or system cron |
| Deployment | Vercel (cloud) or standalone Node.js on your own server |

---

## Quick Start (Local)

### Prerequisites

- Node.js ≥ 20.9 (`node -v`)
- PostgreSQL 15+ running locally
- A [Spotify Developer App](https://developer.spotify.com/dashboard)

### 1. Clone and install

```bash
git clone https://github.com/niklask52t/Dropify
cd Dropify
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables section)
```

### 3. Set up the database

```bash
# Create the PostgreSQL database
createdb dropify

# Run Prisma migrations (creates all tables)
npm run db:migrate

# Optional: view/edit data in Prisma Studio
npm run db:studio
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Spotify Developer App Setup

### 1. Create a Spotify App

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Click **Create app**
3. Fill in:
   - **App name**: Dropify (or any name)
   - **App description**: Spotify release tracker
   - **Redirect URIs**:
     - `http://localhost:3000/api/auth/callback/spotify` (local dev)
     - `https://yourdomain.com/api/auth/callback/spotify` (production)
   - **Which API/SDKs are you planning to use?**: Web API
4. Click **Save**

### 2. Get your credentials

On the app dashboard:
- Copy **Client ID** → `SPOTIFY_CLIENT_ID`
- Click **View client secret** → Copy → `SPOTIFY_CLIENT_SECRET`

### 3. Required OAuth scopes

Dropify requests these scopes at login (handled automatically by NextAuth.js):
- `user-read-email` — to get the user's email address
- `user-read-private` — to get the Spotify user ID

All release and artist data is fetched via the **Client Credentials** flow — no user token is stored or needed.

---

## Database Setup (PostgreSQL + Prisma)

All data is stored **100% locally** in your own PostgreSQL database. No Supabase, no external cloud database.

### 1. Install PostgreSQL (Debian/Ubuntu)

```bash
apt install postgresql postgresql-contrib
systemctl enable --now postgresql
```

### 2. Create the database and user

```bash
sudo -u postgres psql
```

```sql
CREATE USER dropify WITH PASSWORD 'yourpassword';
CREATE DATABASE dropify OWNER dropify;
\q
```

### 3. Set DATABASE_URL in .env.local

```env
DATABASE_URL=postgresql://dropify:yourpassword@localhost:5432/dropify
```

### 4. Run migrations

```bash
npm run db:migrate
```

Prisma creates all tables from `prisma/schema.prisma`:

| Table | Purpose |
|---|---|
| `User`, `Account`, `Session` | NextAuth auth tables |
| `Artist` | Global artist cache (shared across all users) |
| `TrackedArtist` | Per-user watchlist |
| `Release` | Global release cache |
| `NotificationSettings` | Per-user notification prefs |
| `PushSubscription` | VAPID push subscriptions |
| `SyncLog` | Sync history and stats |
| `NotificationSent` | Notification dedup guard |

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```env
# ─── Database ────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://dropify:password@localhost:5432/dropify

# ─── NextAuth ────────────────────────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET=your_64_char_random_string
NEXTAUTH_URL=https://yourdomain.com

# ─── Spotify ─────────────────────────────────────────────────────────────────
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# ─── App URL ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# ─── Access Control ──────────────────────────────────────────────────────────
APP_ACCESS_MODE=public                  # or "private"
ALLOWED_SPOTIFY_USER_IDS=abc123,def456  # find at open.spotify.com/user/<id>
ALLOWED_EMAILS=you@example.com

# ─── Resend (Email Notifications) ────────────────────────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Dropify <notifications@yourdomain.com>

# ─── Web Push (Browser Notifications) ────────────────────────────────────────
# Generate: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:admin@yourdomain.com

# ─── Cron Security ───────────────────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CRON_SECRET=your_random_cron_secret
```

---

## Production Deployment on Debian 13

Complete guide for a fresh **Debian 13 (Trixie)** server.

### System Requirements

| Resource | Minimum | Recommended |
|---|---|---|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Disk | 10 GB | 20 GB |
| OS | Debian 13 | Debian 13 |
| Node.js | 20.9 | 24 LTS (Active LTS) |
| PostgreSQL | 15 | 17 |

---

### 1. Initial Server Setup

```bash
apt update && apt upgrade -y
apt install -y curl wget git build-essential ufw nginx certbot python3-certbot-nginx

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

### 2. Install Node.js 24 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

node -v   # v24.x.x
npm -v

npm install -g pm2
```

---

### 3. Install PostgreSQL 17

```bash
apt install -y postgresql postgresql-contrib
systemctl enable --now postgresql

# Create DB and user
sudo -u postgres psql -c "CREATE USER dropify WITH PASSWORD 'strongpassword';"
sudo -u postgres psql -c "CREATE DATABASE dropify OWNER dropify;"
```

---

### 4. Create a Dedicated App User

```bash
useradd -m -s /bin/bash dropify
passwd dropify
su - dropify
```

---

### 5. Clone and Build

```bash
cd /home/dropify
git clone https://github.com/niklask52t/Dropify
cd Dropify

npm ci

cp .env.example .env.local
nano .env.local   # fill in all values
```

Run database migrations:

```bash
npm run db:migrate
```

Build the app:

```bash
npm run build
```

---

### 6. Start with PM2

```bash
pm2 start npm --name "dropify" -- start -- -p 3000
pm2 save

# Generate systemd startup script (run the printed command as root)
pm2 startup systemd -u dropify --hp /home/dropify

pm2 status
pm2 logs dropify
```

---

### 7. Configure Nginx Reverse Proxy

```bash
nano /etc/nginx/sites-available/dropify
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /sw.js {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

```bash
ln -s /etc/nginx/sites-available/dropify /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

### 8. SSL with Let's Encrypt

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com \
  --email your@email.com --agree-tos --non-interactive

certbot renew --dry-run
systemctl status certbot.timer
```

---

### 9. Daily Sync Cron (Alternative to Vercel Cron)

```bash
# As the dropify user
crontab -e
```

Add:

```cron
0 8 * * * curl -s -X GET https://yourdomain.com/api/cron/sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  >> /home/dropify/cron.log 2>&1
```

---

### 10. Updates

```bash
cd /home/dropify/Dropify
git pull origin main
npm ci
npm run db:migrate   # run if schema changed
npm run build
pm2 reload dropify
```

---

### Deployment Checklist

- [ ] All env vars in `.env.local` are set
- [ ] `NEXTAUTH_URL` = `https://yourdomain.com`
- [ ] `NEXT_PUBLIC_APP_URL` = `https://yourdomain.com`
- [ ] Spotify App redirect URI = `https://yourdomain.com/api/auth/callback/spotify`
- [ ] `NEXTAUTH_SECRET` is a strong random string (32+ bytes)
- [ ] `CRON_SECRET` is a strong random string
- [ ] `npm run db:migrate` completed successfully
- [ ] Firewall: only ports 22, 80, 443 open
- [ ] SSL certificate obtained, auto-renewal tested
- [ ] PM2 startup script installed (survives reboots)
- [ ] `npm run build` completes without errors

---

## Access Control

Set `APP_ACCESS_MODE=private` to restrict who can use the app:

```env
APP_ACCESS_MODE=private
ALLOWED_SPOTIFY_USER_IDS=abc123,def456
ALLOWED_EMAILS=you@example.com,colleague@example.com
```

**How to find your Spotify user ID:**
- Open [open.spotify.com](https://open.spotify.com) → your profile → the ID is in the URL: `open.spotify.com/user/YOUR_ID`
- Or via [spotify.com/account/overview](https://www.spotify.com/account/overview/)

---

## Architecture

```
src/
  app/
    (app)/dashboard/           Release feed with filters
    (app)/artists/             Search + watchlist management
    (app)/calendar/            Monthly calendar view
    (app)/changelog/           Version history page
    (app)/settings/            Account, notifications, watchlist
    api/auth/[...nextauth]/    NextAuth.js route handler
    api/artists/search/        GET  — Spotify artist search
    api/artists/track/         POST/DELETE — track/untrack artist
    api/watchlist/             GET  — user's tracked artists
    api/releases/              GET  — filtered releases
    api/sync/                  POST — manual sync trigger
    api/cron/sync/             GET  — daily cron endpoint (Bearer auth)
    api/notifications/settings/ GET/PATCH — notification preferences
    api/notifications/push/subscribe/ POST/DELETE — push subscriptions
    api/profile/               GET  — current user profile
    login/                     Login page (Spotify OAuth)
    access-denied/             Private mode denial page
  lib/
    auth.ts                    NextAuth.js config (Spotify provider, JWT)
    db.ts                      Prisma client singleton
    spotify.ts                 Spotify Client Credentials API helper
    sync.ts                    Full sync + single-artist sync + notifications
    email.ts                   Resend email notifications
    push.ts                    web-push VAPID notifications
    access-control.ts          Private mode allowlist check
    utils.ts                   Date formatting, type color helpers
  proxy.ts                     Next.js 16 proxy (JWT auth guard + access control)
  types/
    index.ts                   Domain types (Artist, Release, etc.)
    next-auth.d.ts             NextAuth session type extensions
  components/
    layout/Sidebar.tsx         Desktop navigation
    layout/TopBar.tsx          Mobile nav + sync button + user menu
    artists/                   Search, watchlist cards
    releases/                  Feed, card, filters
    calendar/CalendarView.tsx  Monthly calendar
    settings/                  Account info, notifications, watchlist manager
    providers/AuthProvider.tsx NextAuth SessionProvider wrapper

prisma/
  schema.prisma                Complete DB schema (User/Auth + Dropify models)

public/
  sw.js                        Service Worker for push notifications
  manifest.json                PWA manifest
  logo-icon.png                Icon (no text) — sidebar, favicon
  logo-full.png                Logo with text — login page

vercel.json                    Vercel Cron schedule (daily 08:00 UTC)
CHANGELOG.md                   Version history
.env.example                   Environment variable template
```

### Data Flow

```
Login:
  User → NextAuth.js → Spotify OAuth → JWT session
  (Spotify user ID stored in User.spotifyId via auth event)

Music Data (no user token needed):
  App → Spotify Client Credentials API → PostgreSQL cache

Sync Triggers:
  On track   → immediate syncSingleArtist() fire-and-forget
  Manual     → POST /api/sync → runFullSync()
  Daily cron → GET /api/cron/sync (Bearer CRON_SECRET) → runFullSync()
```

**Deduplication**: releases are upserted by `spotifyId` — no duplicates ever.
**Notifications**: sent for releases created in the past 25 h, tracked in `NotificationSent` to prevent re-sending.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) or the in-app [Changelog](/changelog) page.
