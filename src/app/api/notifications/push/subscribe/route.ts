import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
  }

  await supabase.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint, p256dh: keys.p256dh, auth_key: keys.auth },
    { onConflict: 'endpoint' }
  );

  await supabase
    .from('notification_settings')
    .upsert({ user_id: user.id, push_enabled: true }, { onConflict: 'user_id' });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { endpoint } = await request.json();
  if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 });

  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);

  return NextResponse.json({ success: true });
}
