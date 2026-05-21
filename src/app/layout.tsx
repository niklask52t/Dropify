import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/components/providers/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dropify — Track Spotify Releases',
  description: 'Track all new releases from your favorite Spotify artists in one place.',
  manifest: '/manifest.json',
  icons: { icon: '/logo-icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#1DB954',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0a] text-white antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
