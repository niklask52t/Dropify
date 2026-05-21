import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const artistId  = searchParams.get('artistId');
  const type      = searchParams.get('type');
  const dateFrom  = searchParams.get('dateFrom');
  const dateTo    = searchParams.get('dateTo');
  const search    = searchParams.get('search');

  const tracked = await prisma.trackedArtist.findMany({
    where: { userId: session.user.id },
    select: { artist: { select: { spotifyId: true } } },
  });
  const ids = tracked.map((t) => t.artist.spotifyId);
  if (!ids.length) return NextResponse.json({ releases: [] });

  const releases = await prisma.release.findMany({
    where: {
      artistSpotifyId: { in: ids },
      ...(artistId && { artistSpotifyId: artistId }),
      ...(type      && { type }),
      ...(dateFrom  && { releaseDate: { gte: dateFrom } }),
      ...(dateTo    && { releaseDate: { lte: dateTo } }),
      ...(search    && { title: { contains: search, mode: 'insensitive' } }),
    },
    include: { artist: true },
    orderBy: { releaseDate: 'desc' },
    take: 500,
  });

  return NextResponse.json({ releases });
}
