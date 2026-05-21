import { prisma } from './db';
import { getArtistAlbums, getArtist } from './spotify';
import { sendNewReleasesEmail } from './email';
import { sendPushNotification, buildReleaseNotificationPayload } from './push';

export interface SyncResult {
  logId: string;
  artistsSynced: number;
  releasesFound: number;
  newReleases: number;
  errors: string[];
}

export async function runFullSync(triggeredBy = 'cron'): Promise<SyncResult> {
  const log = await prisma.syncLog.create({ data: { triggeredBy } });
  const errors: string[] = [];
  let artistsSynced = 0, releasesFound = 0, newReleases = 0;

  try {
    // Unique artists across all users
    const trackedRows = await prisma.trackedArtist.findMany({
      select: { artist: { select: { id: true, spotifyId: true, name: true } } },
      distinct: ['artistId'],
    });

    for (const row of trackedRows) {
      try {
        const { found, created } = await syncArtistReleases(row.artist.id, row.artist.spotifyId);
        releasesFound += found;
        newReleases += created;
        artistsSynced++;
        await prisma.artist.update({
          where: { id: row.artist.id },
          data: { lastSyncedAt: new Date() },
        });
      } catch (err) {
        errors.push(`${row.artist.name}: ${String(err)}`);
      }
    }

    if (newReleases > 0) await sendNotifications();

    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: 'completed', completedAt: new Date(), artistsSynced, releasesFound, newReleases },
    });
  } catch (err) {
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: 'failed', completedAt: new Date(), errorMessage: String(err) },
    });
    throw err;
  }

  return { logId: log.id, artistsSynced, releasesFound, newReleases, errors };
}

async function syncArtistReleases(
  artistId: string,
  spotifyId: string
): Promise<{ found: number; created: number }> {
  const albums = await getArtistAlbums(spotifyId);
  let created = 0;

  for (const album of albums) {
    const type = album.album_group ?? album.album_type;
    await prisma.release.upsert({
      where: { spotifyId: album.id },
      create: {
        spotifyId: album.id,
        artistSpotifyId: spotifyId,
        title: album.name,
        type,
        releaseDate: album.release_date,
        releaseDatePrecision: album.release_date_precision,
        coverUrl: album.images[0]?.url ?? null,
        spotifyUrl: album.external_urls.spotify,
        totalTracks: album.total_tracks,
        artists: album.artists as object[],
      },
      update: {
        title: album.name,
        coverUrl: album.images[0]?.url ?? null,
        totalTracks: album.total_tracks,
        updatedAt: new Date(),
      },
    });
    created++;
  }

  return { found: albums.length, created };
}

async function sendNotifications() {
  const since = new Date(Date.now() - 25 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    include: {
      notificationSettings: true,
      trackedArtists: { select: { artist: { select: { spotifyId: true } } } },
      pushSubscriptions: true,
    },
  });

  for (const user of users) {
    const settings = user.notificationSettings;
    if (!settings) continue;

    const spotifyIds = user.trackedArtists.map((ta) => ta.artist.spotifyId);
    if (!spotifyIds.length) continue;

    const newReleases = await prisma.release.findMany({
      where: { artistSpotifyId: { in: spotifyIds }, createdAt: { gte: since } },
      include: { artist: true },
      orderBy: { releaseDate: 'desc' },
    });
    if (!newReleases.length) continue;

    const alreadySent = await prisma.notificationSent.findMany({
      where: { userId: user.id, releaseId: { in: newReleases.map((r) => r.id) } },
      select: { releaseId: true, type: true },
    });
    const sentSet = new Set(alreadySent.map((s) => `${s.releaseId}:${s.type}`));

    // Email
    if (settings.emailEnabled && user.email) {
      const unsent = newReleases.filter((r) => !sentSet.has(`${r.id}:email`));
      if (unsent.length) {
        try {
          await sendNewReleasesEmail(user.email, user.name, unsent);
          await prisma.notificationSent.createMany({
            data: unsent.map((r) => ({ userId: user.id, releaseId: r.id, type: 'email' })),
            skipDuplicates: true,
          });
        } catch (e) { console.error('Email failed:', e); }
      }
    }

    // Push
    if (settings.pushEnabled && user.pushSubscriptions.length) {
      const unsent = newReleases.filter((r) => !sentSet.has(`${r.id}:push`));
      for (const release of unsent) {
        for (const sub of user.pushSubscriptions) {
          const payload = buildReleaseNotificationPayload({
            ...release,
            artist: release.artist,
          });
          const result = await sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.authKey } },
            payload
          );
          if (result.gone) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        }
        await prisma.notificationSent.upsert({
          where: { userId_releaseId_type: { userId: user.id, releaseId: release.id, type: 'push' } },
          create: { userId: user.id, releaseId: release.id, type: 'push' },
          update: {},
        });
      }
    }
  }
}

export async function syncSingleArtist(spotifyId: string): Promise<void> {
  const spotifyArtist = await getArtist(spotifyId);

  const artist = await prisma.artist.upsert({
    where: { spotifyId },
    create: {
      spotifyId,
      name: spotifyArtist.name,
      imageUrl: spotifyArtist.images[0]?.url ?? null,
      genres: spotifyArtist.genres,
      popularity: spotifyArtist.popularity,
      followers: spotifyArtist.followers.total,
      spotifyUrl: spotifyArtist.external_urls.spotify,
    },
    update: {
      name: spotifyArtist.name,
      imageUrl: spotifyArtist.images[0]?.url ?? null,
      genres: spotifyArtist.genres,
      popularity: spotifyArtist.popularity,
      followers: spotifyArtist.followers.total,
      spotifyUrl: spotifyArtist.external_urls.spotify,
      updatedAt: new Date(),
    },
  });

  await syncArtistReleases(artist.id, spotifyId);
  await prisma.artist.update({ where: { id: artist.id }, data: { lastSyncedAt: new Date() } });
}
