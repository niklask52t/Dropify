import { createClient } from '@/lib/supabase/server';
import { ArtistsClient } from '@/components/artists/ArtistsClient';
import type { Artist } from '@/types';

export const revalidate = 0;

export default async function ArtistsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: tracked } = await supabase
    .from('tracked_artists')
    .select('id, artist_id, created_at, artists(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const watchlist = (tracked ?? [])
    .map((t) => ({
      trackId: t.id as string,
      artist: t.artists as unknown as Artist,
    }))
    .filter((t) => !!t.artist);

  const trackedSpotifyIds = watchlist.map((t) => t.artist.spotify_id);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Artists</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Search for artists and manage your watchlist.
        </p>
      </div>
      <ArtistsClient watchlist={watchlist} trackedSpotifyIds={trackedSpotifyIds} />
    </div>
  );
}
