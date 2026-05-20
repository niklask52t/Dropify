import type { SpotifyArtist, SpotifyAlbum } from '@/types';

interface TokenCache {
  token: string;
  expires: number;
}

let tokenCache: TokenCache | null = null;

async function getClientToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expires) {
    return tokenCache.token;
  }

  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Spotify token error: ${response.status}`);
  }

  const data = await response.json();
  tokenCache = {
    token: data.access_token,
    expires: Date.now() + (data.expires_in - 60) * 1000,
  };

  return tokenCache.token;
}

async function spotifyFetch<T>(path: string): Promise<T> {
  const token = await getClientToken();
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') ?? '5';
      throw new Error(`Rate limited. Retry after ${retryAfter}s`);
    }
    throw new Error(`Spotify API error: ${response.status} on ${path}`);
  }

  return response.json();
}

export async function searchArtists(query: string, limit = 20): Promise<SpotifyArtist[]> {
  const params = new URLSearchParams({ q: query, type: 'artist', limit: String(limit) });
  const data = await spotifyFetch<{ artists: { items: SpotifyArtist[] } }>(
    `/search?${params}`
  );
  return data.artists.items;
}

export async function getArtist(spotifyId: string): Promise<SpotifyArtist> {
  return spotifyFetch<SpotifyArtist>(`/artists/${spotifyId}`);
}

export async function getArtistAlbums(
  spotifyId: string,
  market = 'US'
): Promise<SpotifyAlbum[]> {
  const albums: SpotifyAlbum[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const params = new URLSearchParams({
      include_groups: 'album,single,appears_on,compilation',
      market,
      limit: String(limit),
      offset: String(offset),
    });

    const data = await spotifyFetch<{
      items: SpotifyAlbum[];
      next: string | null;
      total: number;
    }>(`/artists/${spotifyId}/albums?${params}`);

    albums.push(...data.items);

    if (!data.next || albums.length >= data.total) break;
    offset += limit;

    // Safety cap: max 500 releases per artist
    if (albums.length >= 500) break;
  }

  return albums;
}

export async function getMultipleArtists(spotifyIds: string[]): Promise<SpotifyArtist[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < spotifyIds.length; i += 50) {
    chunks.push(spotifyIds.slice(i, i + 50));
  }

  const results: SpotifyArtist[] = [];
  for (const chunk of chunks) {
    const data = await spotifyFetch<{ artists: SpotifyArtist[] }>(
      `/artists?ids=${chunk.join(',')}`
    );
    results.push(...data.artists);
  }

  return results;
}
