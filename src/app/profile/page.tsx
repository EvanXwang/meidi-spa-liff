'use client';

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthContext } from '@/providers/AuthProvider';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { MeResponse } from '@/types/index';

export default function ProfilePage() {
  const { userId, displayName, pictureUrl, loading: authLoading } = useContext(AuthContext);
  const [meData, setMeData] = useState<MeResponse | null>(null);
  const [meError, setMeError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    apiFetch<MeResponse>('/api/me')
      .then(setMeData)
      .catch((e: unknown) => {
        console.error('[Profile] /api/me error:', e);
        setMeError(e instanceof Error ? e.message : 'Failed to load data');
      });
  }, [userId]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-50">
        <LoadingSpinner />
      </div>
    );
  }

  const initials = displayName ? displayName.charAt(0).toUpperCase() : '?';

  function handleLogout() {
    import('@line/liff').then(({ default: liff }) => {
      liff.logout();
      window.location.href = '/';
    });
  }

  return (
    <main className="min-h-screen bg-amber-50 p-4 pb-8 max-w-md mx-auto space-y-4">
      {/* Back link */}
      <div className="pt-4 pb-2">
        <Link href="/dashboard" className="text-amber-700 font-medium flex items-center gap-1">
          ← 返回
        </Link>
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center py-6 gap-3">
        {pictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pictureUrl}
            alt={displayName ?? '會員'}
            width={80}
            height={80}
            className="rounded-full w-20 h-20 object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-amber-400 flex items-center justify-center text-white text-3xl font-bold">
            {initials}
          </div>
        )}
        <div className="text-center">
          <p className="text-xl font-bold text-gray-800">{displayName ?? '會員'}</p>
          <p className="text-sm text-gray-500 mt-0.5">LINE 會員</p>
        </div>
      </div>

      {/* Account Info */}
      <Card>
        <h2 className="text-base font-semibold text-gray-800 mb-3">帳戶資訊</h2>

        {!meData && !meError && <LoadingSpinner />}

        {meError && (
          <p className="text-red-500 text-sm">載入失敗：{meError}</p>
        )}

        {meData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">儲值餘額</p>
              <p className="text-sm font-semibold text-amber-700">
                NT${meData.wallet.storage_value.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">累計點數</p>
              <p className="text-sm font-semibold text-amber-700">
                {meData.wallet.points} 點
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Logout */}
      <div className="pt-2">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full text-red-600 border-red-300 hover:bg-red-50"
        >
          登出
        </Button>
      </div>
    </main>
  );
}
