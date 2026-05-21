# Dropify

**Track every release from your favorite Spotify artists — in one place.**

A production-ready web app for tracking Spotify artist releases. Multiple users can log in with their Spotify account, track artists, and see all releases in a central dashboard with calendar view, filters, and push/email notifications.

![Dropify](public/logo-full.png)

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Quick Start (Local)](#quick-start-local)
4. [Spotify Developer App Setup](#spotify-developer-app-setup)
5. [Supabase Setup](#supabase-setup)
6. [Environment Variables](#environment-variables)
7. [Production Deployment on Debian 13](#production-deployment-on-debian-13)
8. [Access Control](#access-control)
9. [Architecture](#architecture)
10. [Changelog](#changelog)

---

## Features

| Feature | Details |
|---|---|
| **Spotify OAuth Login** | Sign in with Spotify, profile sync, logout |
| **Access Control** | Private or public mode, allowlist by Spotify ID or email |
| **Artist Search** | Debounced global search, artist cards with image, genres, popularity, followers |
| **Watchlist** | Per-user tracked artists, no duplicates, instant remove |
| **Release Sync** | Albums, Singles, EPs, Compilations, Appears On |
| **Dashboard** | All releases from tracked artists, filters: artist / type / date / search |
| **Calendar** | Monthly calendar with per-day release drill-down |
| **Auto Sync** | Daily Vercel Cron (08:00 UTC) + manual trigger |
| **Email Notifications** | New release emails via Resend (HTML template) |
| **Push Notifications** | Browser push via VAPID / web-push |
| **Settings** | Account info, notification prefs, watchlist management |
| **Security** | RLS on all tables, Spotify secrets server-side only |
| **Responsive** | Dark theme, works on all screen sizes |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 6 |
| Styling | Tailwind CSS 4 |
| Auth | NextAuth.js v4 + Spotify Provider |
| Database | PostgreSQL + Prisma ORM v6 |
| Spotify Data | Spotify Client Credentials API |
| Email | Resend v6 |
| Push | web-push (VAPID) |
| Cron | Vercel Cron Jobs |
| Deployment | Vercel (cloud) or standalone Node.js |

---

## Quick Start (Local)

### Prerequisites

- Node.js ≥ 20.9 (`node -v`)
- PostgreSQL 15+ running locally or on your server
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

# Push the Prisma schema and run migrations
npm run db:migrate

# (Dev only) view data in Prisma Studio
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
   - **Redirect URIs**: `http://localhost:3000/auth/callback` (for local) + `https://yourdomain.com/auth/callback` (for production)
   - **Which API/SDKs are you planning to use?**: Web API
4. Click **Save**

### 2. Get your credentials

On the app dashboard:
- Copy **Client ID** → `SPOTIFY_CLIENT_ID`
- Click **View client secret** → Copy → `SPOTIFY_CLIENT_SECRET`

### 3. Required OAuth scopes (handled by Supabase Auth)

Dropify requests these scopes on login:
- `user-read-email` — to get the user's email
- `user-read-private` — to get the Spotify user ID

All release/artist data is fetched via **Client Credentials** (no user token required).

### 4. Configure Redirect URI in your Spotify App

NextAuth handles the OAuth flow at `/api/auth/callback/spotify`. Add this to your Spotify app's **Redirect URIs**:

- `http://localhost:3000/api/auth/callback/spotify` (local dev)
- `https://yourdomain.com/api/auth/callback/spotify` (production)

---

## Database Setup (PostgreSQL + Prisma)

All data is stored **100% locally** in your own PostgreSQL database. No cloud service required.

### 1. Install PostgreSQL

```bash
# Debian/Ubuntu
apt install postgresql postgresql-contrib

# Start service
systemctl enable --now postgresql
```

### 2. Create the database and user

```bash
sudo -u postgres psql

-- In psql:
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

Prisma creates all tables automatically from `prisma/schema.prisma`. Tables:
- `User`, `Account`, `Session` — NextAuth auth tables
- `Artist` — global artist cache
- `TrackedArtist` — per-user watchlist
- `Release` — global release cache
- `NotificationSettings` — per-user prefs
- `PushSubscription` — VAPID subscriptions
- `SyncLog` — sync history
- `NotificationSent` — notification dedup guard

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```env
# ─── Database ────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://dropify:password@localhost:5432/dropify

# ─── NextAuth ────────────────────────────────────────────────────────────────
NEXTAUTH_SECRET=your_64_char_random_string   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_URL=https://yourdomain.com

# ─── Spotify ─────────────────────────────────────────────────────────────────
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here

# ─── App URL ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# ─── Access Control ──────────────────────────────────────────────────────────
APP_ACCESS_MODE=public                  # or "private"
ALLOWED_SPOTIFY_USER_IDS=abc123,def456  # find at spotify.com/account/overview
ALLOWED_EMAILS=you@example.com

# ─── Resend (Email) ──────────────────────────────────────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Dropify <notifications@yourdomain.com>

# ─── Web Push ────────────────────────────────────────────────────────────────
# Generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_EMAIL=mailto:admin@yourdomain.com

# ─── Cron Security ───────────────────────────────────────────────────────────
CRON_SECRET=generate_a_random_64_char_string_here
```

**Generate VAPID keys:**
```bash
npx web-push generate-vapid-keys
```

**Generate a CRON_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Production Deployment on Debian 13

This guide walks through a complete production setup on a fresh **Debian 13 (Trixie)** server.

### System Requirements

| Resource | Minimum | Recommended |
|---|---|---|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Disk | 10 GB | 20 GB |
| OS | Debian 13 | Debian 13 |
| Node.js | 20.9 LTS | 22 LTS |

---

### 1. Initial Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install essentials
apt install -y curl wget git build-essential ufw nginx certbot python3-certbot-nginx

# Configure firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

### 2. Install Node.js 22 LTS

```bash
# Install via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Verify
node -v   # should show v22.x.x
npm -v

# Install PM2 for process management
npm install -g pm2
```

---

### 3. Create a Dedicated User

```bash
# Create non-root user for the app
useradd -m -s /bin/bash dropify
passwd dropify

# Add to sudo group if needed
usermod -aG sudo dropify

# Switch to app user
su - dropify
```

---

### 4. Clone and Build the App

```bash
# As the dropify user
cd /home/dropify

# Clone the repo
git clone https://github.com/niklask52t/Dropify
cd Dropify

# Install dependencies (production only for smaller footprint)
npm ci

# Create environment file
cp .env.example .env.local
nano .env.local   # Fill in all values
```

**Build the app:**

```bash
npm run build
```

A successful build outputs something like:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    ...
├ ƒ /dashboard                           ...
...
```

---

### 5. Start with PM2

```bash
# Start the Next.js server with PM2
pm2 start npm --name "dropify" -- start -- -p 3000

# Save PM2 config so it restarts on reboot
pm2 save

# Generate and enable systemd startup script
pm2 startup systemd -u dropify --hp /home/dropify
# Run the command PM2 prints (as root)

# Check status
pm2 status
pm2 logs dropify
```

---

### 6. Configure Nginx Reverse Proxy

```bash
# As root
nano /etc/nginx/sites-available/dropify
```

Paste this config (replace `yourdomain.com`):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP → HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL — certbot will fill this in
    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Proxy to Next.js
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

    # Next.js static files — long cache
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Service worker — must not be cached
    location /sw.js {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

Enable and test:

```bash
ln -s /etc/nginx/sites-available/dropify /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

### 7. SSL with Let's Encrypt

```bash
# Obtain certificate (replace with your domain)
certbot --nginx -d yourdomain.com -d www.yourdomain.com \
  --email your@email.com \
  --agree-tos \
  --non-interactive

# Test auto-renewal
certbot renew --dry-run

# Certbot sets up a systemd timer for auto-renewal by default
systemctl status certbot.timer
```

---

### 8. Daily Sync Cron (Self-Hosted Alternative to Vercel Cron)

If you're **not** deploying on Vercel, set up a system cron job instead:

```bash
# As the dropify user
crontab -e
```

Add:

```cron
# Run Dropify release sync every day at 08:00 UTC
0 8 * * * curl -s -X GET https://yourdomain.com/api/cron/sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  >> /home/dropify/cron.log 2>&1
```

Replace `YOUR_CRON_SECRET` with the value from `.env.local`.

---

### 9. Updates and Redeployment

```bash
cd /home/dropify/Dropify

# Pull latest code
git pull origin main

# Install any new deps
npm ci

# Rebuild
npm run build

# Reload PM2 (zero-downtime)
pm2 reload dropify
```

---

### 10. Monitoring

```bash
# Live logs
pm2 logs dropify

# Process status
pm2 status

# Nginx access log
tail -f /var/log/nginx/access.log

# Nginx error log
tail -f /var/log/nginx/error.log
```

---

### Deployment Checklist

Before going live:

- [ ] All env vars in `.env.local` are set
- [ ] `NEXT_PUBLIC_APP_URL` matches your actual domain (HTTPS)
- [ ] Spotify App redirect URIs include `https://yourdomain.com/auth/callback`
- [ ] Supabase Auth redirect URLs include `https://yourdomain.com/auth/callback`
- [ ] `CRON_SECRET` is a strong random value
- [ ] Firewall allows only ports 22, 80, 443
- [ ] SSL certificate obtained and auto-renewal tested
- [ ] PM2 startup script installed (survives reboots)
- [ ] `npm run build` completes without errors

---

## Access Control

Set `APP_ACCESS_MODE=private` in your env to restrict access. Then configure the allowlist:

```env
APP_ACCESS_MODE=private
ALLOWED_SPOTIFY_USER_IDS=abc123def,xyz789abc
ALLOWED_EMAILS=you@example.com,colleague@example.com
```

**How to find your Spotify user ID:**
1. Open [open.spotify.com](https://open.spotify.com)
2. Click your profile → "Profile"
3. The ID is in the URL: `https://open.spotify.com/user/YOUR_ID_HERE`

Or: [spotify.com/account/overview](https://www.spotify.com/account/overview/) → Profile

---

## Architecture

```
src/
  app/
    (app)/dashboard/       Release feed with filters
    (app)/artists/         Search + watchlist management
    (app)/calendar/        Monthly calendar view
    (app)/changelog/       This changelog page
    (app)/settings/        Account, notifications, watchlist
    api/artists/search/    GET  — Spotify artist search
    api/artists/track/     POST/DELETE — track/untrack
    api/watchlist/         GET  — user's watchlist
    api/releases/          GET  — filtered releases
    api/sync/              POST — manual sync trigger
    api/cron/sync/         GET  — daily cron endpoint
    api/notifications/     settings + push subscription
    auth/callback/         Supabase OAuth callback
    login/                 Login page
    access-denied/         Private mode denial
  lib/
    supabase/client.ts     Browser Supabase client
    supabase/server.ts     Server + service role client (async cookies)
    spotify.ts             Client Credentials API helper
    sync.ts                Full sync + single-artist sync + notifications
    email.ts               Resend email service
    push.ts                web-push VAPID service
    access-control.ts      Allowlist check
    utils.ts               Shared formatting helpers
  proxy.ts                 Next.js 16 proxy (auth guard + access control)
  types/index.ts           All TypeScript types

supabase/migrations/
  001_schema.sql           Full schema + RLS policies + auth trigger

public/
  sw.js                    Service Worker for push notifications
  manifest.json            PWA manifest
  logo-icon.png            Dropify icon (no text) — favicon, sidebar
  logo-full.png            Dropify logo with text — login page

vercel.json                Cron schedule: daily 08:00 UTC
CHANGELOG.md               Version history
```

### Sync Architecture

| Trigger | When | What |
|---|---|---|
| **On track** | User tracks a new artist | Immediate fire-and-forget sync for that artist |
| **Manual** | User clicks "Sync" in TopBar | Full sync of all tracked artists |
| **Daily cron** | 08:00 UTC via Vercel / system cron | Full sync + notifications for new releases |

**Deduplication**: releases are upserted by `spotify_id` — no duplicates ever.  
**Notifications**: sent for releases created in the past 25 h, tracked in `notifications_sent` to prevent re-sending.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) or the in-app [Changelog](/changelog) page.
