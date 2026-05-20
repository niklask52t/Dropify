import { createClient } from '@/lib/supabase/server';
import { ReleaseFeed } from '@/components/releases/ReleaseFeed';
import type { Release, Artist } from '@/types';

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's tracked artist IDs
  const { data: tracked } = await supabase
    .from('tracked_artists')
    .select('artist_id, artists(spotify_id)')
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
      .order('release_date', { ascending: false })
      .limit(200);

    releases = (data ?? []) as (Release & { artist?: Artist })[];
  }

  // Get tracked artists for filter dropdown
  const { data: artistsList } = await supabase
    .from('tracked_artists')
    .select('artists(id, spotify_id, name, image_url)')
    .eq('user_id', user.id);

  const trackedArtists = (artistsList ?? [])
    .map((t) => t.artists as unknown as Artist | null)
    .filter((a): a is Artist => !!a);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          All releases from your tracked artists, sorted by date.
        </p>
      </div>

      <ReleaseFeed
        releases={releases}
        trackedArtists={trackedArtists}
        totalTracked={artistSpotifyIds.length}
      />
    </div>
  );
}
