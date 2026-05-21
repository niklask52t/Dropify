import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ReleaseFeed } from '@/components/releases/ReleaseFeed';
import type { Release, Artist } from '@/types';

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const tracked = await prisma.trackedArtist.findMany({
    where: { userId: session.user.id },
    select: { artist: { select: { spotifyId: true } } },
  });

  const artistSpotifyIds = tracked.map((t) => t.artist.spotifyId);

  let releases: (Release & { artist?: Artist })[] = [];

  if (artistSpotifyIds.length > 0) {
    const rows = await prisma.release.findMany({
      where: { artistSpotifyId: { in: artistSpotifyIds } },
      include: { artist: true },
      orderBy: { releaseDate: 'desc' },
      take: 200,
    });
    releases = rows as unknown as (Release & { artist?: Artist })[];
  }

  const artistRows = await prisma.trackedArtist.findMany({
    where: { userId: session.user.id },
    include: { artist: true },
  });
  const trackedArtists = artistRows.map((t) => t.artist) as unknown as Artist[];

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
