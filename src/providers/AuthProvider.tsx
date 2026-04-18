'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { initLiff, getLiffProfile, getLiffIdToken, liff } from '@/lib/liff';
import { setToken, apiFetch } from '@/lib/api';

interface AuthContextType {
  userId: string | null;
  displayName: string | null;
  pictureUrl: string | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  userId: null,
  displayName: null,
  pictureUrl: null,
  loading: true,
});

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runAuthFlow() {
      try {
        // Dev mode: bypass LIFF and use mock data
        if (process.env.NEXT_PUBLIC_ENABLE_DEV === 'true') {
          setUserId('dev-user-001');
          setDisplayName('Dev User');
          setPictureUrl('');

          const data = await apiFetch<{ token: string; userId: string }>(
            '/api/dev/mock-token',
            { method: 'POST', body: JSON.stringify({ userId: 'dev-user-001' }) }
          );
          setToken(data.token);
          setLoading(false);
          return;
        }

        // Production: full LIFF auth flow
        await initLiff();

        if (!liff.isLoggedIn()) {
          liff.login();
          return; // Page will reload after LINE login
        }

        const profile = await getLiffProfile();
        const idToken = getLiffIdToken();

        const data = await apiFetch<{ token: string; userId: string }>(
          '/api/auth/line',
          {
            method: 'POST',
            body: JSON.stringify({ idToken }),
          }
        );

        setToken(data.token);
        setUserId(data.userId);
        setDisplayName(profile.displayName);
        setPictureUrl(profile.pictureUrl);
        setLoading(false);
      } catch (err) {
        console.error('[AuthProvider] Auth flow failed:', err);
        // Keep loading=true so the app shows the loading screen rather than crashing
      }
    }

    runAuthFlow();
  }, []);

  return (
    <AuthContext.Provider value={{ userId, displayName, pictureUrl, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
