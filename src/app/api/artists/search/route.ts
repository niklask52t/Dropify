import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchArtists } from '@/lib/spotify';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q) return NextResponse.json({ artists: [] });

  try {
    const artists = await searchArtists(q, 20);
    return NextResponse.json({ artists });
  } catch (err) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
