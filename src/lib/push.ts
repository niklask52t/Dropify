import webpush from 'web-push';
import type { Release } from '@/types';

if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL ?? 'mailto:admin@dropify.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: object
): Promise<{ success: boolean; gone?: boolean }> {
  try {
    await webpush.sendNotification(subscription as webpush.PushSubscription, JSON.stringify(payload));
    return { success: true };
  } catch (err: unknown) {
    const error = err as { statusCode?: number };
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, gone: true };
    }
    return { success: false };
  }
}

export function buildReleaseNotificationPayload(release: Omit<Release, 'artist'> & { artist?: { name: string } }) {
  return {
    title: `New ${release.type}: ${release.title}`,
    body: release.artist?.name ?? 'Unknown artist',
    icon: release.cover_url ?? '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: `release-${release.spotify_id}`,
    data: {
      url: release.spotify_url ?? process.env.NEXT_PUBLIC_APP_URL + '/dashboard',
    },
  };
}
