'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Music2, Calendar, Settings, ScrollText } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/artists',   label: 'Artists',   icon: Music2 },
  { href: '/calendar',  label: 'Calendar',  icon: Calendar },
  { href: '/changelog', label: 'Changelog', icon: ScrollText },
  { href: '/settings',  label: 'Settings',  icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 bg-zinc-950 border-r border-zinc-800/60 shrink-0">
      {/* Logo — icon only in sidebar header */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-zinc-800/60">
        <Image
          src="/logo-icon.png"
          alt="Dropify"
          width={28}
          height={28}
          className="shrink-0"
        />
        <span className="font-bold text-white text-lg tracking-tight">Dropify</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-brand/10 text-brand'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-zinc-800/60">
        <p className="text-zinc-600 text-xs">Dropify v0.2.0</p>
      </div>
    </aside>
  );
}
