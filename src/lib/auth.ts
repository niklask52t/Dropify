import type { NextAuthOptions } from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: { scope: 'user-read-email user-read-private' },
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === 'spotify') {
        token.spotifyId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; spotifyId?: string }).id = token.sub;
        (session.user as { id?: string; spotifyId?: string }).spotifyId =
          token.spotifyId as string | undefined;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (!user.id) return;

      // Save Spotify user ID on the User record
      if (account?.provider === 'spotify' && account.providerAccountId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { spotifyId: account.providerAccountId },
        });
      }

      // Ensure notification settings row exists
      await prisma.notificationSettings.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });
    },
  },
};
