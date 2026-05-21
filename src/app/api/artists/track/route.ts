import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncSingleArtist } from '@/lib/sync';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { spotifyId, name, imageUrl, genres, popularity, followers, spotifyUrl } = body;

  if (!spotifyId || !name) {
    return NextResponse.json({ error: 'spotifyId and name required' }, { status: 400 });
  }

  await supabase.from('artists').upsert(
    {
      spotify_id: spotifyId,
      name,
      image_url: imageUrl ?? null,
      genres: genres ?? [],
      popularity: popularity ?? 0,
      followers: followers ?? 0,
      spotify_url: spotifyUrl ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'spotify_id' }
  );

  const { data: artist, error: fetchErr } = await supabase
    .from('artists')
    .select('id, spotify_id, name, image_url, genres, popularity, followers, spotify_url')
    .eq('spotify_id', spotifyId)
    .single();

  if (fetchErr || !artist) {
    return NextResponse.json({ error: 'Failed to resolve artist' }, { status: 500 });
  }

  const { error: trackErr } = await supabase.from('tracked_artists').insert({
    user_id: user.id,
    artist_id: artist.id,
  });

  if (trackErr) {
    if (trackErr.code === '23505') {
      return NextResponse.json({ message: 'Already tracking', artist }, { status: 200 });
    }
    return NextResponse.json({ error: trackErr.message }, { status: 500 });
  }

  syncSingleArtist(spotifyId).catch(console.error);

  return NextResponse.json({ success: true, artist });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const spotifyId = searchParams.get('spotifyId');
  if (!spotifyId) return NextResponse.json({ error: 'spotifyId required' }, { status: 400 });

  const { data: artist } = await supabase
    .from('artists')
    .select('id')
    .eq('spotify_id', spotifyId)
    .single();

  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

  await supabase
    .from('tracked_artists')
    .delete()
    .eq('user_id', user.id)
    .eq('artist_id', artist.id);

  return NextResponse.json({ success: true });
}
