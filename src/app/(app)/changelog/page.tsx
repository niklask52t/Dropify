import { cn } from '@/lib/utils';

interface ChangeEntry {
  type: 'feature' | 'improvement' | 'fix' | 'breaking';
  text: string;
}

interface Release {
  version: string;
  date: string;
  summary: string;
  changes: ChangeEntry[];
}

const releases: Release[] = [
  {
    version: '0.2.0',
    date: '2026-05-21',
    summary: 'Major stack upgrade to Next.js 16, Tailwind CSS 4, React 19 and all latest stable packages.',
    changes: [
      { type: 'breaking',     text: 'Upgraded to Next.js 16 — proxy.ts replaces middleware.ts, async cookies API' },
      { type: 'breaking',     text: 'Tailwind CSS 4 — CSS-first config with @theme, no tailwind.config.ts' },
      { type: 'improvement',  text: 'React 19.2 with full Server Components and compiler support' },
      { type: 'improvement',  text: '@supabase/ssr 0.10 with async cookies support for Next.js 16' },
      { type: 'improvement',  text: 'Resend v6 email SDK' },
      { type: 'improvement',  text: 'date-fns v4 (ESM-only)' },
      { type: 'improvement',  text: 'lucide-react v1 with new icon set' },
      { type: 'improvement',  text: 'TypeScript 6 strictness improvements' },
      { type: 'feature',      text: 'Real Dropify logo — icon-only in sidebar/TopBar, full logo with text on login' },
      { type: 'feature',      text: 'Changelog page (this page)' },
      { type: 'improvement',  text: 'Complete Debian 13 production deployment guide in README' },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-05-21',
    summary: 'Initial release — full production-ready Spotify release tracker.',
    changes: [
      { type: 'feature', text: 'Spotify OAuth login via Supabase Auth' },
      { type: 'feature', text: 'Private / public access mode with allowlist (Spotify ID + email)' },
      { type: 'feature', text: 'Artist search with 350ms debounce — cards show image, genres, popularity, followers' },
      { type: 'feature', text: 'Per-user artist watchlist with track / untrack support' },
      { type: 'feature', text: 'Release sync: albums, singles, EPs, compilations, appears_on via Spotify API' },
      { type: 'feature', text: 'Dashboard with filters: artist, type, date range, free-text search' },
      { type: 'feature', text: 'Monthly calendar view with click-to-expand day detail' },
      { type: 'feature', text: 'Daily Vercel Cron sync at 08:00 UTC + manual sync button' },
      { type: 'feature', text: 'Email notifications via Resend — HTML email with release list' },
      { type: 'feature', text: 'Browser push notifications via VAPID web-push' },
      { type: 'feature', text: 'Per-user notification settings (email / push on/off)' },
      { type: 'feature', text: 'Settings page — account info, notifications, watchlist management' },
      { type: 'feature', text: 'Supabase Row Level Security — users can only see their own data' },
      { type: 'feature', text: 'Responsive dark UI with Tailwind CSS' },
      { type: 'feature', text: 'Service Worker for background push notifications' },
    ],
  },
];

const typeConfig: Record<ChangeEntry['type'], { label: string; className: string }> = {
  feature:     { label: 'New',      className: 'bg-brand/15 text-brand border-brand/30' },
  improvement: { label: 'Improved', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  fix:         { label: 'Fixed',    className: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  breaking:    { label: 'Breaking', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

export default function ChangelogPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Changelog</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          All notable changes to Dropify.
        </p>
      </div>

      <div className="max-w-2xl space-y-10">
        {releases.map((release) => (
          <div key={release.version} className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 top-8 bottom-0 w-px bg-zinc-800 ml-[7px]" />

            {/* Version dot */}
            <div className="flex items-start gap-5">
              <div className="shrink-0 mt-1 w-4 h-4 rounded-full bg-brand ring-4 ring-[#0a0a0a] ring-offset-0 z-10" />

              <div className="flex-1 pb-2">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="font-bold text-white text-lg">v{release.version}</span>
                  <span className="text-zinc-500 text-sm">{release.date}</span>
                </div>

                <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                  {release.summary}
                </p>

                {/* Changes */}
                <div className="card p-4 space-y-2.5">
                  {release.changes.map((change, i) => {
                    const cfg = typeConfig[change.type];
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <span className={cn('badge shrink-0 mt-0.5', cfg.className)}>
                          {cfg.label}
                        </span>
                        <span className="text-zinc-300 text-sm leading-relaxed">
                          {change.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
