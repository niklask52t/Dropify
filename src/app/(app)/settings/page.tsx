import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AccountInfo } from '@/components/settings/AccountInfo';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { WatchlistManager } from '@/components/settings/WatchlistManager';
import type { Artist, AppUser } from '@/types';

export const revalidate = 0;

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const [dbUser, notifSettings, trackedRows] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true, spotifyId: true, createdAt: true, updatedAt: true },
    }),
    prisma.notificationSettings.findUnique({ where: { userId: session.user.id } }),
    prisma.trackedArtist.findMany({
      where: { userId: session.user.id },
      include: { artist: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const watchlist = trackedRows.map((t) => ({
    trackId: t.id,
    artist: t.artist as unknown as Artist,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 mt-1 text-sm">Manage your account and preferences.</p>
      </div>
      <div className="space-y-6 max-w-2xl">
        <AccountInfo
          user={dbUser as AppUser | null}
          isPrivateMode={process.env.APP_ACCESS_MODE === 'private'}
        />
        <NotificationSettings
          initialSettings={
            notifSettings
              ? { emailEnabled: notifSettings.emailEnabled, pushEnabled: notifSettings.pushEnabled }
              : null
          }
        />
        <WatchlistManager watchlist={watchlist} />
      </div>
    </div>
  );
}
