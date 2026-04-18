'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { initLiff, getLiffProfile, getLiffIdToken, liff } from '@/lib/liff';
import { setToken, apiFetch } from '@/lib/api';

interface AuthContextType {
  userId: string | null;
  displayName: string | null;
  pictureUrl: string | null;
  loading: boolean;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType>({
  userId: null,
  displayName: null,
  pictureUrl: null,
  loading: true,
  error: null,
});

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<string>('init');

  useEffect(() => {
    async function runAuthFlow() {
      try {
        // Dev mode: bypass LIFF and use mock data
        if (process.env.NEXT_PUBLIC_ENABLE_DEV === 'true') {
          setStage('dev-mode');
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
        setStage('liff-init');
        await initLiff();

        setStage('liff-check-login');
        if (!liff.isLoggedIn()) {
          setStage('liff-login-redirect');
          liff.login();
          return; // Page will reload after LINE login
        }

        setStage('liff-get-profile');
        const profile = await getLiffProfile();

        setStage('liff-get-token');
        const idToken = getLiffIdToken();
        if (!idToken) {
          throw new Error('LIFF idToken is null — LINE Login scope may be missing "openid"');
        }

        setStage('api-auth-line');
        const data = await apiFetch<{ token: string; userId: string }>(
          '/api/auth/line',
          {
            method: 'POST',
            body: JSON.stringify({ idToken }),
          }
        );

        setStage('done');
        setToken(data.token);
        setUserId(data.userId);
        setDisplayName(profile.displayName);
        setPictureUrl(profile.pictureUrl);
        setLoading(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[AuthProvider] Auth flow failed at stage:', stage, err);
        setError(`[${stage}] ${msg}`);
        setLoading(false);
      }
    }

    runAuthFlow();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-amber-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-6 space-y-3">
          <h2 className="text-lg font-bold text-red-700">登入失敗</h2>
          <p className="text-sm text-gray-700 break-words">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-2 font-medium"
          >
            重試
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ userId, displayName, pictureUrl, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
