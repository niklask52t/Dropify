import { Resend } from 'resend';
import type { Release } from '@/types';
import { formatReleaseDate, getReleaseTypeLabel } from './utils';

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Dropify <noreply@dropify.app>';

type EmailRelease = Omit<Release, 'artist'> & {
  artist?: { name: string };
};

export async function sendNewReleasesEmail(
  userEmail: string,
  userName: string | null,
  releases: EmailRelease[]
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const count = releases.length;
  const subject =
    count === 1
      ? `New release: ${releases[0].title} — Dropify`
      : `${count} new releases from your artists — Dropify`;

  const releasesHtml = releases
    .slice(0, 20)
    .map(
      (r) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="60" style="vertical-align:top;">
              ${r.cover_url ? `<img src="${r.cover_url}" width="56" height="56" style="border-radius:6px;" />` : '<div style="width:56px;height:56px;background:#2a2a2a;border-radius:6px;"></div>'}
            </td>
            <td style="padding-left:12px; vertical-align:top;">
              <div style="font-weight:600; color:#ffffff; font-size:14px;">${r.title}</div>
              <div style="color:#b3b3b3; font-size:13px; margin-top:2px;">${r.artist?.name ?? ''}</div>
              <div style="margin-top:4px;">
                <span style="background:#1DB954;color:#000;font-size:11px;padding:2px 7px;border-radius:99px;font-weight:600;">${getReleaseTypeLabel(r.type)}</span>
                <span style="color:#666; font-size:12px; margin-left:8px;">${formatReleaseDate(r.release_date, r.release_date_precision)}</span>
              </div>
            </td>
            <td style="vertical-align:middle; text-align:right;">
              <a href="${r.spotify_url ?? '#'}" style="color:#1DB954; font-size:13px; text-decoration:none;">Open ↗</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111111;border-radius:12px;border:1px solid #2a2a2a;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1DB954,#0d8c3d);padding:24px 32px;">
          <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
            ◆ Dropify
          </span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 8px;color:#ffffff;font-size:20px;">
            ${count === 1 ? '1 new release' : `${count} new releases`}
          </h2>
          <p style="margin:0 0 24px;color:#b3b3b3;font-size:14px;">
            Hi ${userName ?? 'there'} — here's what dropped from your tracked artists.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${releasesHtml}
          </table>
          ${count > 20 ? `<p style="color:#666;font-size:13px;margin-top:16px;">+ ${count - 20} more releases on your dashboard.</p>` : ''}
        </td></tr>
        <!-- CTA -->
        <tr><td style="padding:0 32px 32px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
             style="display:inline-block;background:#1DB954;color:#000000;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">
            Open Dashboard →
          </a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 32px;border-top:1px solid #2a2a2a;">
          <p style="margin:0;color:#555;font-size:12px;">
            You're receiving this because you have email notifications enabled in Dropify.
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color:#1DB954;">Manage settings</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: FROM,
    to: userEmail,
    subject,
    html,
  });
}
