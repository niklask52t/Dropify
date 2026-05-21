import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ArtistsClient } from '@/components/artists/ArtistsClient';
import type { Artist } from '@/types';

export const revalidate = 0;

export default async function ArtistsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const tracked = await prisma.trackedArtist.findMany({
    where: { userId: session.user.id },
    include: { artist: true },
    orderBy: { createdAt: 'desc' },
  });

  const watchlist = tracked.map((t) => ({
    trackId: t.id,
    artist: t.artist as unknown as Artist,
  }));

  const trackedSpotifyIds = watchlist.map((t) => t.artist.spotifyId);

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
