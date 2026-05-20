export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
}

export function checkAccess(userEmail: string | undefined, spotifyId: string | undefined): AccessCheckResult {
  const mode = process.env.APP_ACCESS_MODE ?? 'public';

  if (mode !== 'private') {
    return { allowed: true };
  }

  const allowedEmails = (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const allowedSpotifyIds = (process.env.ALLOWED_SPOTIFY_USER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!allowedEmails.length && !allowedSpotifyIds.length) {
    return { allowed: false, reason: 'No users configured in allowlist' };
  }

  if (userEmail && allowedEmails.includes(userEmail.toLowerCase())) {
    return { allowed: true };
  }

  if (spotifyId && allowedSpotifyIds.includes(spotifyId)) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'User not in allowlist' };
}

export function isPrivateMode(): boolean {
  return process.env.APP_ACCESS_MODE === 'private';
}
