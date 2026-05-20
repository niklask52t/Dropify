-- ─────────────────────────────────────────────────────────────────────────────
-- Dropify Database Schema
-- Run this against your Supabase project via the SQL editor or CLI
-- ─────────────────────────────────────────────────────────────────────────────

-- Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  display_name TEXT,
  avatar_url  TEXT,
  spotify_id  TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Artists (global cache, shared across all users)
CREATE TABLE IF NOT EXISTS public.artists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_id      TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  image_url       TEXT,
  genres          TEXT[] DEFAULT '{}',
  popularity      INTEGER DEFAULT 0,
  followers       INTEGER DEFAULT 0,
  spotify_url     TEXT,
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- User watchlist (many-to-many: profiles <-> artists)
CREATE TABLE IF NOT EXISTS public.tracked_artists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artist_id  UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, artist_id)
);

-- Releases (global cache, shared across all users)
CREATE TABLE IF NOT EXISTS public.releases (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_id            TEXT UNIQUE NOT NULL,
  artist_spotify_id     TEXT NOT NULL,
  title                 TEXT NOT NULL,
  type                  TEXT NOT NULL,
  release_date          TEXT NOT NULL,
  release_date_precision TEXT NOT NULL DEFAULT 'day',
  cover_url             TEXT,
  spotify_url           TEXT,
  total_tracks          INTEGER DEFAULT 0,
  artists               JSONB DEFAULT '[]',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS releases_artist_spotify_id_idx ON public.releases(artist_spotify_id);
CREATE INDEX IF NOT EXISTS releases_release_date_idx ON public.releases(release_date DESC);

-- Notification settings (per user)
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_enabled  BOOLEAN DEFAULT TRUE,
  push_enabled   BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint   TEXT UNIQUE NOT NULL,
  p256dh     TEXT NOT NULL,
  auth_key   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync logs
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'running',
  artists_synced  INTEGER DEFAULT 0,
  releases_found  INTEGER DEFAULT 0,
  new_releases    INTEGER DEFAULT 0,
  error_message   TEXT,
  triggered_by    TEXT DEFAULT 'cron'
);

-- Notifications sent (dedup guard)
CREATE TABLE IF NOT EXISTS public.notifications_sent (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  sent_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, release_id, type)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: auto-create profile on signup
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, spotify_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'provider_id'
  )
  ON CONFLICT (id) DO UPDATE SET
    email        = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    avatar_url   = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    spotify_id   = COALESCE(EXCLUDED.spotify_id, profiles.spotify_id),
    updated_at   = NOW();

  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artists_read_all"   ON public.artists FOR SELECT USING (true);
CREATE POLICY "artists_service_rw" ON public.artists FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE public.tracked_artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tracked_artists_own" ON public.tracked_artists FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "releases_read_all"   ON public.releases FOR SELECT USING (true);
CREATE POLICY "releases_service_rw" ON public.releases FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_settings_own" ON public.notification_settings FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_subs_own" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_logs_service" ON public.sync_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "sync_logs_read_auth" ON public.sync_logs FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.notifications_sent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_sent_own" ON public.notifications_sent FOR ALL USING (auth.uid() = user_id);
