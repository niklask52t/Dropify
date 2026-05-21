import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { searchArtists } from '@/lib/spotify';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  if (!q) return NextResponse.json({ artists: [] });

  try {
    const artists = await searchArtists(q, 20);
    return NextResponse.json({ artists });
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
