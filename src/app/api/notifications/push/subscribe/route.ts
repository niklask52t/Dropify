import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { endpoint, keys } = await request.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where:  { endpoint },
    create: { userId: session.user.id, endpoint, p256dh: keys.p256dh, authKey: keys.auth },
    update: { p256dh: keys.p256dh, authKey: keys.auth },
  });

  await prisma.notificationSettings.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id, pushEnabled: true },
    update: { pushEnabled: true },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { endpoint } = await request.json();
  if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 });

  await prisma.pushSubscription.deleteMany({
    where: { userId: session.user.id, endpoint },
  });
  return NextResponse.json({ success: true });
}
