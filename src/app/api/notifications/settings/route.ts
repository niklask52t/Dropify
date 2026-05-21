import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await prisma.notificationSettings.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (body.email_enabled !== undefined) data.emailEnabled = Boolean(body.email_enabled);
  if (body.push_enabled  !== undefined) data.pushEnabled  = Boolean(body.push_enabled);

  const settings = await prisma.notificationSettings.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });
  return NextResponse.json({ settings });
}
