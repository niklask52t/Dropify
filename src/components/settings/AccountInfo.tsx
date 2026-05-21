'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import { LogOut, Shield, User } from 'lucide-react';

interface AccountInfoProps {
  profile: Profile | null;
  isPrivateMode: boolean;
}

export function AccountInfo({ profile, isPrivateMode }: AccountInfoProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <User size={16} className="text-zinc-400" />
        <h2 className="font-semibold text-white">Account</h2>
      </div>

      <div className="flex items-center gap-4 mb-5">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.display_name ?? ''}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-zinc-700"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-brand/20 flex items-center justify-center text-brand text-xl font-bold ring-2 ring-zinc-700">
            {((profile?.display_name ?? profile?.email ?? '?')[0]).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-white">{profile?.display_name ?? 'Unknown'}</p>
          <p className="text-zinc-400 text-sm">{profile?.email}</p>
          {profile?.spotify_id && (
            <p className="text-zinc-600 text-xs mt-0.5">Spotify ID: {profile.spotify_id}</p>
          )}
        </div>
      </div>

      {isPrivateMode && (
        <div className="flex items-start gap-2.5 p-3 bg-zinc-800/50 rounded-lg mb-4 border border-zinc-700">
          <Shield size={14} className="text-brand mt-0.5 shrink-0" />
          <div className="text-xs text-zinc-400 leading-relaxed">
            <p className="text-zinc-300 font-medium mb-0.5">Private Mode Active</p>
            <p>Only allowlisted users can access this Dropify instance.</p>
            {profile?.spotify_id && (
              <p className="mt-1 font-mono text-zinc-500">Your Spotify ID: {profile.spotify_id}</p>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleSignOut}
        disabled={loading}
        className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors border border-red-500/20"
      >
        <LogOut size={14} />
        {loading ? 'Signing out...' : 'Sign out'}
      </button>
    </div>
  );
}
