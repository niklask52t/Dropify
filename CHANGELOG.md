# Changelog

All notable changes to Dropify are documented here.

---

## [0.2.0] — 2026-05-21

**Major stack upgrade to all latest stable packages.**

### Breaking
- Next.js 16 — `middleware.ts` → `proxy.ts`, async `cookies()` API required
- Tailwind CSS 4 — CSS-first config with `@theme`, no `tailwind.config.ts`
- TypeScript 6 strict mode

### Improved
- React 19.2 with React Compiler support
- `@supabase/ssr` 0.10 — async cookies for Next.js 16
- Resend v6 email SDK
- `date-fns` v4 (ESM-only)
- `lucide-react` v1
- Real Dropify logos (icon + full) integrated into UI

### Added
- Changelog page inside the app (`/changelog`)
- Complete Debian 13 production deployment guide in README

---

## [0.1.0] — 2026-05-21

**Initial release — full production-ready Spotify release tracker.**

### Added
- Spotify OAuth login via Supabase Auth
- Private/public access mode with allowlist (Spotify user ID + email)
- Artist search with debounce — cards show image, genres, popularity, followers
- Per-user artist watchlist (track / untrack)
- Release sync: albums, singles, EPs, compilations, appears_on
- Dashboard with filters (artist / type / date range / text search)
- Monthly calendar view with click-to-expand day panel
- Daily Vercel Cron sync (08:00 UTC) + manual sync button
- Email notifications via Resend (HTML template)
- Browser push notifications via VAPID
- Per-user notification settings (email / push on/off)
- Settings page — account info, notifications, watchlist management
- Row Level Security — users only access their own data
- Responsive dark UI (Tailwind CSS)
- Service Worker (`public/sw.js`) for push notifications
- PWA manifest
