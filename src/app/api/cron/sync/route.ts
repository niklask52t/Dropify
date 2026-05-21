import { NextResponse } from 'next/server';
import { runFullSync } from '@/lib/sync';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runFullSync('cron');
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('Cron sync failed:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
