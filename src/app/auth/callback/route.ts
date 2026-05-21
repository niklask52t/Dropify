import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAccess } from '@/lib/access-control';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;
      const spotifyId = user.user_metadata?.provider_id as string | undefined;

      const { allowed } = checkAccess(user.email, spotifyId);
      if (!allowed) {
        return NextResponse.redirect(new URL('/access-denied', requestUrl.origin));
      }

      await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email,
          display_name:
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            user.user_metadata?.preferred_username,
          avatar_url: user.user_metadata?.avatar_url,
          spotify_id: spotifyId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
}
