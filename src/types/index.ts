export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  spotify_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Artist {
  id: string;
  spotify_id: string;
  name: string;
  image_url: string | null;
  genres: string[];
  popularity: number;
  followers: number;
  spotify_url: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrackedArtist {
  id: string;
  user_id: string;
  artist_id: string;
  created_at: string;
  artist?: Artist;
}

export interface Release {
  id: string;
  spotify_id: string;
  artist_spotify_id: string;
  title: string;
  type: 'album' | 'single' | 'compilation' | 'appears_on';
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  cover_url: string | null;
  spotify_url: string | null;
  total_tracks: number;
  artists: SpotifyArtistRef[];
  created_at: string;
  updated_at: string;
  artist?: Artist;
}

export interface SpotifyArtistRef {
  id: string;
  name: string;
  external_urls: { spotify: string };
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  created_at: string;
}

export interface SyncLog {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'completed' | 'failed';
  artists_synced: number;
  releases_found: number;
  new_releases: number;
  error_message: string | null;
  triggered_by: string;
}

// Spotify API response types
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
