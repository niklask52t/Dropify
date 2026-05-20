import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const artistSpotifyId = searchParams.get('artistId');
  const type = searchParams.get('type');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const search = searchParams.get('search');

  // Get tracked artists
  const { data: tracked } = await supabase
    .from('tracked_artists')
    .select('artists(spotify_id)')
    .eq('user_id', user.id);

  const trackedSpotifyIds = (tracked ?? [])
    .map((t) => (t.artists as unknown as { spotify_id: string } | null)?.spotify_id)
    .filter((id): id is string => !!id);

  if (!trackedSpotifyIds.length) {
    return NextResponse.json({ releases: [] });
  }

  let query = supabase
    .from('releases')
    .select('*, artist:artist_spotify_id(id, name, image_url, spotify_url, spotify_id)')
    .in('artist_spotify_id', trackedSpotifyIds)
    .order('release_date', { ascending: false })
    .limit(500);

  if (artistSpotifyId) {
    query = query.eq('artist_spotify_id', artistSpotifyId);
  }
  if (type) {
    query = query.eq('type', type);
  }
  if (dateFrom) {
    query = query.gte('release_date', dateFrom);
  }
  if (dateTo) {
    query = query.lte('release_date', dateTo);
  }
  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ releases: data ?? [] });
}
