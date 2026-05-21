import webpush from 'web-push';

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
    const e = err as { statusCode?: number };
    if (e.statusCode === 410 || e.statusCode === 404) return { success: false, gone: true };
    return { success: false };
  }
}

interface PushRelease {
  type: string;
  title: string;
  coverUrl?: string | null;
  spotifyUrl?: string | null;
  spotifyId: string;
  artist?: { name: string } | null;
}

export function buildReleaseNotificationPayload(release: PushRelease) {
  return {
    title: `New ${release.type}: ${release.title}`,
    body: release.artist?.name ?? 'Unknown artist',
    icon: release.coverUrl ?? '/logo-icon.png',
    badge: '/logo-icon.png',
    tag: `release-${release.spotifyId}`,
    data: { url: release.spotifyUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` },
  };
}
