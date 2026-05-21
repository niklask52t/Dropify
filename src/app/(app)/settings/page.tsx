import { createClient } from '@/lib/supabase/server';
import { AccountInfo } from '@/components/settings/AccountInfo';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { WatchlistManager } from '@/components/settings/WatchlistManager';
import type { Artist } from '@/types';

export const revalidate = 0;

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profileResult, notifResult, watchlistResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('notification_settings').select('*').eq('user_id', user.id).single(),
    supabase
      .from('tracked_artists')
      .select('id, artist_id, created_at, artists(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  const profile = profileResult.data;
  const notifSettings = notifResult.data;
  const watchlist = (watchlistResult.data ?? [])
    .map((t) => ({ trackId: t.id, artist: t.artists as unknown as Artist }))
    .filter((t) => !!t.artist);

  const isPrivate = process.env.APP_ACCESS_MODE === 'private';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 mt-1 text-sm">Manage your account and preferences.</p>
      </div>
      <div className="space-y-6 max-w-2xl">
        <AccountInfo profile={profile} isPrivateMode={isPrivate} />
        <NotificationSettings initialSettings={notifSettings} />
        <WatchlistManager watchlist={watchlist} />
      </div>
    </div>
  );
}
