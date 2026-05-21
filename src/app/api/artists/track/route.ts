import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncSingleArtist } from '@/lib/sync';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { spotifyId, name, imageUrl, genres, popularity, followers, spotifyUrl } = body;

  if (!spotifyId || !name) {
    return NextResponse.json({ error: 'spotifyId and name required' }, { status: 400 });
  }

  const artist = await prisma.artist.upsert({
    where: { spotifyId },
    create: { spotifyId, name, imageUrl, genres, popularity, followers, spotifyUrl },
    update: { name, imageUrl, genres, popularity, followers, spotifyUrl, updatedAt: new Date() },
  });

  try {
    await prisma.trackedArtist.create({
      data: { userId: session.user.id, artistId: artist.id },
    });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === 'P2002') {
      return NextResponse.json({ message: 'Already tracking', artist }, { status: 200 });
    }
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  syncSingleArtist(spotifyId).catch(console.error);
  return NextResponse.json({ success: true, artist });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const spotifyId = searchParams.get('spotifyId');
  if (!spotifyId) return NextResponse.json({ error: 'spotifyId required' }, { status: 400 });

  const artist = await prisma.artist.findUnique({ where: { spotifyId }, select: { id: true } });
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

  await prisma.trackedArtist.deleteMany({
    where: { userId: session.user.id, artistId: artist.id },
  });

  return NextResponse.json({ success: true });
}
