'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { LogOut, RefreshCw, ChevronDown, LayoutDashboard, Music2, Calendar, Settings, ScrollText } from 'lucide-react';
import Link from 'next/link';
import type { AppUser } from '@/types';

interface TopBarProps { user: AppUser | null }

export function TopBar({ user }: TopBarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncing, setSyncing]   = useState(false);

  async function handleSync() {
    setSyncing(true);
    try { await fetch('/api/sync', { method: 'POST' }); router.refresh(); }
    finally { setSyncing(false); }
  }

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard },
    { href: '/artists',   icon: Music2 },
    { href: '/calendar',  icon: Calendar },
    { href: '/changelog', icon: ScrollText },
    { href: '/settings',  icon: Settings },
  ];

  const displayName = user?.name ?? user?.email ?? 'User';
  const initial     = displayName[0].toUpperCase();

  return (
    <header className="h-16 bg-zinc-950 border-b border-zinc-800/60 flex items-center px-4 sm:px-6 gap-4 shrink-0">
      {/* Mobile logo */}
      <div className="md:hidden flex items-center gap-2">
        <Image src="/logo-icon.png" alt="Dropify" width={26} height={26} />
        <span className="font-bold text-white text-base">Dropify</span>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden flex items-center gap-1 ml-2">
        {navItems.map(({ href, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn('p-2 rounded-lg transition-colors',
              pathname.startsWith(href) ? 'text-brand bg-brand/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            )}>
            <Icon size={18} />
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      <button onClick={handleSync} disabled={syncing}
        className="hidden sm:flex btn-ghost items-center gap-2" title="Sync all artists">
        <RefreshCw size={15} className={cn(syncing && 'animate-spin')} />
        <span className="text-xs">{syncing ? 'Syncing…' : 'Sync'}</span>
      </button>

      {/* User menu */}
      <div className="relative">
        <button onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2.5 hover:bg-zinc-800 px-2 py-1.5 rounded-lg transition-colors">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center text-brand text-xs font-bold">
              {initial}
            </div>
          )}
          <span className="hidden sm:block text-sm text-white max-w-[120px] truncate">{displayName}</span>
          <ChevronDown size={14} className="text-zinc-400" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="p-1">
                <button onClick={() => { handleSync(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                  <RefreshCw size={14} /> Sync releases
                </button>
                <button onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
