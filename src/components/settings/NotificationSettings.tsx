'use client';

import { useState } from 'react';
import { Bell, Mail, Smartphone, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NotificationSettings as NS } from '@/types';

interface NotificationSettingsProps {
  initialSettings: NS | null;
}

export function NotificationSettings({ initialSettings }: NotificationSettingsProps) {
  const [settings, setSettings] = useState({
    email_enabled: initialSettings?.email_enabled ?? true,
    push_enabled: initialSettings?.push_enabled ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  async function saveSettings(updates: Partial<typeof settings>) {
    const next = { ...settings, ...updates };
    setSettings(next);
    setSaving(true);
    setSaved(false);

    await fetch('/api/notifications/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function subscribeToPush() {
    setPushLoading(true);
    setPushError(null);

    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications not supported in this browser');
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
        ) as unknown as ArrayBuffer,
      });

      const subJson = sub.toJSON();
      await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subJson),
      });

      setSettings((s) => ({ ...s, push_enabled: true }));
    } catch (err) {
      setPushError(err instanceof Error ? err.message : 'Failed to enable push notifications');
    } finally {
      setPushLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    setPushLoading(true);
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            await fetch('/api/notifications/push/subscribe', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ endpoint: sub.endpoint }),
            });
            await sub.unsubscribe();
          }
        }
      }
      await saveSettings({ push_enabled: false });
    } finally {
      setPushLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={16} className="text-zinc-400" />
        <h2 className="font-semibold text-white">Notifications</h2>
        {saved && (
          <span className="ml-auto flex items-center gap-1 text-xs text-brand">
            <Check size={12} /> Saved
          </span>
        )}
        {saving && <span className="ml-auto text-xs text-zinc-500">Saving...</span>}
      </div>

      <div className="space-y-4">
        {/* Email */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
              <Mail size={15} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Email notifications</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Get an email when tracked artists release new music.
              </p>
            </div>
          </div>
          <button
            onClick={() => saveSettings({ email_enabled: !settings.email_enabled })}
            className={cn(
              'relative w-10 h-5.5 rounded-full transition-colors shrink-0',
              settings.email_enabled ? 'bg-brand' : 'bg-zinc-700'
            )}
            style={{ height: '22px', width: '40px' }}
          >
            <span
              className={cn(
                'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                settings.email_enabled ? 'translate-x-5' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>

        {/* Push */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
              <Smartphone size={15} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Push notifications</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Instant browser notifications for new releases.
              </p>
              {pushError && (
                <p className="text-xs text-red-400 mt-1">{pushError}</p>
              )}
            </div>
          </div>

          {settings.push_enabled ? (
            <button
              onClick={unsubscribeFromPush}
              disabled={pushLoading}
              className="shrink-0 text-xs text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              {pushLoading ? '...' : 'Disable'}
            </button>
          ) : (
            <button
              onClick={subscribeToPush}
              disabled={pushLoading}
              className="shrink-0 text-xs text-brand border border-brand/30 hover:bg-brand/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              {pushLoading ? '...' : 'Enable'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
