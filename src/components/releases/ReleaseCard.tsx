import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { cn, formatReleaseDate, getReleaseTypeLabel, getReleaseTypeColor } from '@/lib/utils';
import type { Release, Artist } from '@/types';

interface ReleaseCardProps {
  release: Release & { artist?: Artist };
  compact?: boolean;
}

export function ReleaseCard({ release, compact = false }: ReleaseCardProps) {
  const artist = release.artist;

  return (
    <div className={cn('card-hover flex items-center gap-3', compact ? 'p-2.5' : 'p-3')}>
      {/* Cover */}
      <div className={cn('relative shrink-0 rounded-lg overflow-hidden bg-zinc-800', compact ? 'w-10 h-10' : 'w-14 h-14')}>
        {release.cover_url ? (
          <Image
            src={release.cover_url}
            alt={release.title}
            fill
            className="object-cover"
            sizes={compact ? '40px' : '56px'}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <svg width={compact ? 16 : 20} height={compact ? 16 : 20} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn('font-semibold text-white leading-tight truncate', compact ? 'text-xs' : 'text-sm')}>
          {release.title}
        </p>
        {artist && (
          <p className={cn('text-zinc-400 truncate mt-0.5', compact ? 'text-xs' : 'text-xs')}>
            {artist.name}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={cn('badge text-[10px]', getReleaseTypeColor(release.type))}>
            {getReleaseTypeLabel(release.type)}
          </span>
          {!compact && (
            <span className="text-zinc-500 text-xs">
              {formatReleaseDate(release.release_date, release.release_date_precision)}
            </span>
          )}
        </div>
      </div>

      {/* Date + link */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        {compact ? (
          <span className="text-zinc-500 text-[10px]">
            {formatReleaseDate(release.release_date, release.release_date_precision)}
          </span>
        ) : (
          <span className="text-zinc-500 text-xs hidden sm:block">
            {formatReleaseDate(release.release_date, release.release_date_precision)}
          </span>
        )}
        {release.spotify_url && (
          <a
            href={release.spotify_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 hover:text-brand transition-colors"
            title="Open on Spotify"
          >
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </div>
  );
}
