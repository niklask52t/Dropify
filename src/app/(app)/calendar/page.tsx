import { createClient } from '@/lib/supabase/server';
import { CalendarView } from '@/components/calendar/CalendarView';
import type { Release, Artist } from '@/types';

export const revalidate = 0;

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: tracked } = await supabase
    .from('tracked_artists')
    .select('artists(spotify_id)')
    .eq('user_id', user.id);

  const artistSpotifyIds = (tracked ?? [])
    .map((t) => (t.artists as unknown as { spotify_id: string } | null)?.spotify_id)
    .filter((id): id is string => !!id);

  let releases: (Release & { artist?: Artist })[] = [];

  if (artistSpotifyIds.length > 0) {
    const { data } = await supabase
      .from('releases')
      .select('*, artist:artist_spotify_id(id, name, image_url, spotify_url, spotify_id)')
      .in('artist_spotify_id', artistSpotifyIds)
      .eq('release_date_precision', 'day')
      .order('release_date', { ascending: false });

    releases = (data ?? []) as (Release & { artist?: Artist })[];
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Browse releases by date. Only releases with exact dates are shown.
        </p>
      </div>
      <CalendarView releases={releases} />
    </div>
  );
}
