import type { Metadata } from 'next';
import { ToastViewport } from '@/components/common/ToastViewport';
import { APP_NAME } from '@/constants';
import { AuthProvider } from '@/features/auth';
import { getServerUser } from '@/lib/supabase/server';
import './globals.css';

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Member verification and vendor management for 88West.',
};

/**
 * Root layout. The session is resolved on the server and handed to
 * `AuthProvider` as `initialUser`, so the first paint already knows who is
 * signed in — no loading flicker, no client-side session fetch on boot.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();

  return (
    <html lang="en">
      <body>
        <AuthProvider
          initialUser={user ? { id: user.id, email: user.email ?? '' } : null}
        >
          {children}
          <ToastViewport />
        </AuthProvider>
      </body>
    </html>
  );
}
