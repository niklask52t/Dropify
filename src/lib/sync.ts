import { createServiceClient } from './supabase/server';
import { getArtistAlbums, getArtist } from './spotify';
import { sendNewReleasesEmail } from './email';
import { sendPushNotification, buildReleaseNotificationPayload } from './push';
import type { Release } from '@/types';

export interface SyncResult {
  logId: string;
  artistsSynced: number;
  releasesFound: number;
  newReleases: number;
  errors: string[];
}

export async function runFullSync(triggeredBy = 'cron'): Promise<SyncResult> {
  const supabase = createServiceClient();
  const errors: string[] = [];

  // Create sync log
  const { data: log } = await supabase
    .from('sync_logs')
    .insert({ status: 'running', triggered_by: triggeredBy })
    .select()
    .single();

  const logId = log?.id ?? 'unknown';

  let artistsSynced = 0;
  let releasesFound = 0;
  let newReleases = 0;

  try {
    // Get all unique tracked artists across all users
    const { data: trackedRows } = await supabase
      .from('tracked_artists')
      .select('artist_id, artists(spotify_id, name)');

    if (!trackedRows?.length) {
      await finalizeSyncLog(supabase, logId, 'completed', 0, 0, 0);
      return { logId, artistsSynced: 0, releasesFound: 0, newReleases: 0, errors: [] };
    }

    // Deduplicate artists
    const seen = new Set<string>();
    const uniqueArtists: Array<{ id: string; spotify_id: string; name: string }> = [];

    for (const row of trackedRows) {
      const artist = row.artists as unknown as { spotify_id: string; name: string } | null;
      if (!artist || seen.has(row.artist_id)) continue;
      seen.add(row.artist_id);
      uniqueArtists.push({ id: row.artist_id, spotify_id: artist.spotify_id, name: artist.name });
    }

    // Sync each artist
    for (const artist of uniqueArtists) {
      try {
        const { found, created } = await syncArtistReleases(supabase, artist.id, artist.spotify_id);
        releasesFound += found;
        newReleases += created;
        artistsSynced++;

        // Update artist last_synced_at
        await supabase
          .from('artists')
          .update({ last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', artist.id);
      } catch (err) {
        errors.push(`Artist ${artist.name}: ${String(err)}`);
      }
    }

    // Send notifications for new releases
    if (newReleases > 0) {
      await sendNotifications(supabase);
    }

    await finalizeSyncLog(supabase, logId, 'completed', artistsSynced, releasesFound, newReleases);
  } catch (err) {
    await supabase
      .from('sync_logs')
      .update({ status: 'failed', completed_at: new Date().toISOString(), error_message: String(err) })
      .eq('id', logId);
    throw err;
  }

  return { logId, artistsSynced, releasesFound, newReleases, errors };
}

async function syncArtistReleases(
  supabase: ReturnType<typeof createServiceClient>,
  artistId: string,
  spotifyId: string
): Promise<{ found: number; created: number }> {
  const albums = await getArtistAlbums(spotifyId);

  let created = 0;

  for (const album of albums) {
    const type = album.album_group ?? album.album_type;

    const { error } = await supabase.from('releases').upsert(
      {
        spotify_id: album.id,
        artist_spotify_id: spotifyId,
        title: album.name,
        type,
        release_date: album.release_date,
        release_date_precision: album.release_date_precision,
        cover_url: album.images[0]?.url ?? null,
        spotify_url: album.external_urls.spotify,
        total_tracks: album.total_tracks,
        artists: album.artists,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'spotify_id', ignoreDuplicates: false }
    );

    if (!error) created++;
  }

  return { found: albums.length, created };
}

async function sendNotifications(supabase: ReturnType<typeof createServiceClient>) {
  // Find users who need notifications for new releases from their tracked artists
  const { data: users } = await supabase
    .from('profiles')
    .select(`
      id, email, display_name,
      notification_settings(email_enabled, push_enabled),
      tracked_artists(artist_id, artists(spotify_id))
    `);

  if (!users) return;

  for (const user of users) {
    const settings = (user.notification_settings as unknown as Array<{ email_enabled: boolean; push_enabled: boolean }>)?.[0];
    if (!settings) continue;

    const artistSpotifyIds = (user.tracked_artists as unknown as Array<{ artists: { spotify_id: string } }>)
      ?.map((ta) => ta.artists?.spotify_id)
      .filter(Boolean) ?? [];

    if (!artistSpotifyIds.length) continue;

    // Find releases created in the last 25 hours that haven't been notified yet
    const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

    const { data: newReleases } = await supabase
      .from('releases')
      .select('*, artists:artist_spotify_id(name)')
      .in('artist_spotify_id', artistSpotifyIds)
      .gte('created_at', since)
      .order('release_date', { ascending: false });

    if (!newReleases?.length) continue;

    // Filter out already-notified
    const releaseIds = newReleases.map((r: { id: string }) => r.id);
    const { data: alreadySent } = await supabase
      .from('notifications_sent')
      .select('release_id, type')
      .eq('user_id', user.id)
      .in('release_id', releaseIds);

    const sentSet = new Set(
      (alreadySent ?? []).map((s: { release_id: string; type: string }) => `${s.release_id}:${s.type}`)
    );

    const toNotify = newReleases.filter(
      (r: { id: string }) => !sentSet.has(`${r.id}:email`) || !sentSet.has(`${r.id}:push`)
    ) as (Release & { artists?: { name: string } })[];

    if (!toNotify.length) continue;

    // Email
    if (settings.email_enabled && user.email) {
      const unEmailed = toNotify.filter((r) => !sentSet.has(`${r.id}:email`));
      if (unEmailed.length) {
        try {
          const releasesWithArtist = unEmailed.map((r) => ({
            ...r,
            artist: r.artists as unknown as { name: string } | undefined,
          }));
          await sendNewReleasesEmail(user.email, user.display_name, releasesWithArtist);
          await supabase.from('notifications_sent').insert(
            unEmailed.map((r) => ({ user_id: user.id, release_id: r.id, type: 'email' }))
          );
        } catch (e) {
          console.error('Email notification failed:', e);
        }
      }
    }

    // Push
    if (settings.push_enabled) {
      const unPushed = toNotify.filter((r) => !sentSet.has(`${r.id}:push`));
      if (unPushed.length) {
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', user.id);

        for (const release of unPushed) {
          for (const sub of subs ?? []) {
            const payload = buildReleaseNotificationPayload({
              ...release,
              artist: release.artists as unknown as { name: string } | undefined,
            });
            const result = await sendPushNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
              payload
            );
            if (result.gone) {
              await supabase.from('push_subscriptions').delete().eq('id', sub.id);
            }
          }
          await supabase
            .from('notifications_sent')
            .insert({ user_id: user.id, release_id: release.id, type: 'push' });
        }
      }
    }
  }
}

async function finalizeSyncLog(
  supabase: ReturnType<typeof createServiceClient>,
  logId: string,
  status: string,
  artistsSynced: number,
  releasesFound: number,
  newReleases: number
) {
  await supabase.from('sync_logs').update({
    status,
    completed_at: new Date().toISOString(),
    artists_synced: artistsSynced,
    releases_found: releasesFound,
    new_releases: newReleases,
  }).eq('id', logId);
}

// Sync a single artist immediately (called when user first tracks an artist)
export async function syncSingleArtist(artistSpotifyId: string): Promise<void> {
  const supabase = createServiceClient();

  // Ensure artist exists in DB
  const spotifyArtist = await getArtist(artistSpotifyId);

  await supabase.from('artists').upsert(
    {
      spotify_id: spotifyArtist.id,
      name: spotifyArtist.name,
      image_url: spotifyArtist.images[0]?.url ?? null,
      genres: spotifyArtist.genres,
      popularity: spotifyArtist.popularity,
      followers: spotifyArtist.followers.total,
      spotify_url: spotifyArtist.external_urls.spotify,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'spotify_id' }
  );

  const { data: artist } = await supabase
    .from('artists')
    .select('id')
    .eq('spotify_id', artistSpotifyId)
    .single();

  if (artist) {
    await syncArtistReleases(supabase, artist.id, artistSpotifyId);
    await supabase
      .from('artists')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', artist.id);
  }
}
