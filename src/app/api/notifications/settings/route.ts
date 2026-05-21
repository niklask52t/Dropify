import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({ settings: data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { email_enabled, push_enabled } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (email_enabled !== undefined) updates.email_enabled = Boolean(email_enabled);
  if (push_enabled !== undefined)  updates.push_enabled  = Boolean(push_enabled);

  const { data, error } = await supabase
    .from('notification_settings')
    .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}
