import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CalendarView } from '@/components/calendar/CalendarView';
import type { Release, Artist } from '@/types';

export const revalidate = 0;

export default async function CalendarPage() {
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
      where: {
        artistSpotifyId: { in: artistSpotifyIds },
        releaseDatePrecision: 'day',
      },
      include: { artist: true },
      orderBy: { releaseDate: 'desc' },
    });
    releases = rows as unknown as (Release & { artist?: Artist })[];
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
