// ─── Domain types (camelCase, matching Prisma model fields) ──────────────────

export interface AppUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  spotifyId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Artist {
  id: string;
  spotifyId: string;
  name: string;
  imageUrl: string | null;
  genres: string[];
  popularity: number;
  followers: number;
  spotifyUrl: string | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackedArtist {
  id: string;
  userId: string;
  artistId: string;
  createdAt: Date;
  artist?: Artist;
}

export interface Release {
  id: string;
  spotifyId: string;
  artistSpotifyId: string;
  title: string;
  type: 'album' | 'single' | 'compilation' | 'appears_on';
  releaseDate: string;
  releaseDatePrecision: 'year' | 'month' | 'day';
  coverUrl: string | null;
  spotifyUrl: string | null;
  totalTracks: number;
  artists: SpotifyArtistRef[];
  createdAt: Date;
  updatedAt: Date;
  artist?: Artist;
}

export interface SpotifyArtistRef {
  id: string;
  name: string;
  external_urls: { spotify: string };
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  authKey: string;
  createdAt: Date;
}

export interface SyncLog {
  id: string;
  startedAt: Date;
  completedAt: Date | null;
  status: 'running' | 'completed' | 'failed';
  artistsSynced: number;
  releasesFound: number;
  newReleases: number;
  errorMessage: string | null;
  triggeredBy: string;
}

// ─── Spotify API response types ───────────────────────────────────────────────

export interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{ url: string; width: number; height: number }>;
  genres: string[];
  popularity: number;
  followers: { total: number };
  external_urls: { spotify: string };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: 'album' | 'single' | 'compilation';
  album_group?: 'album' | 'single' | 'compilation' | 'appears_on';
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  images: Array<{ url: string; width: number; height: number }>;
  external_urls: { spotify: string };
  total_tracks: number;
  artists: SpotifyArtistRef[];
}

export interface ReleaseFilters {
  artistId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
