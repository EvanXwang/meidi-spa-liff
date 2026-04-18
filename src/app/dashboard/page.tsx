'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { AuthContext } from '@/providers/AuthProvider';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { MeResponse } from '@/types/index';

export default function DashboardPage() {
  const { userId, displayName, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  const [meData, setMeData] = useState<MeResponse | null>(null);
  const [meError, setMeError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    apiFetch<MeResponse>('/api/me')
      .then(setMeData)
      .catch((e: unknown) => {
        console.error('[Dashboard] /api/me error:', e);
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

  return (
    <main className="min-h-screen bg-amber-50 p-4 pb-8 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="pt-4 pb-2">
        <h1 className="text-2xl font-bold text-amber-700">美的原點 Spa 仕女館</h1>
        <p className="mt-1 text-gray-600">歡迎回來，{displayName ?? '會員'}</p>
      </div>

      {/* Loading state for me data */}
      {!meData && !meError && <LoadingSpinner />}

      {/* Error state */}
      {meError && (
        <Card>
          <p className="text-red-500 text-sm">載入失敗：{meError}</p>
        </Card>
      )}

      {meData && (
        <>
          {/* Wallet Card */}
          <Card>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">💰 儲值餘額</p>
                <p className="text-xl font-bold text-amber-700">
                  NT${meData.wallet.storage_value.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">🏆 點數</p>
                <p className="text-xl font-bold text-amber-700">
                  {meData.wallet.points} 點
                </p>
              </div>
            </div>
          </Card>

          {/* Upcoming Bookings */}
          <Card>
            <h2 className="text-base font-semibold text-gray-800 mb-3">即將到來的預約</h2>
            {meData.upcomingBookings.length === 0 ? (
              <p className="text-sm text-gray-400">暫無預約</p>
            ) : (
              <div className="space-y-3">
                {meData.upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-xl bg-amber-50 border border-amber-100 p-3"
                  >
                    <p className="font-medium text-gray-800">{booking.service.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {format(parseISO(booking.scheduled_start), 'MM/dd HH:mm')}
                    </p>
                    {booking.therapist && (
                      <p className="text-sm text-gray-500">
                        {booking.therapist.name}
                        {booking.therapist.title ? ` ${booking.therapist.title}` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Course Balances */}
          <Card>
            <h2 className="text-base font-semibold text-gray-800 mb-3">我的課程包</h2>
            {meData.courseBalances.length === 0 ? (
              <p className="text-sm text-gray-400">暫無課程</p>
            ) : (
              <div className="space-y-2">
                {meData.courseBalances.map((cb) => (
                  <div key={cb.id} className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">{cb.service.name}</p>
                    <p className="text-sm font-medium text-amber-700">
                      剩餘 {cb.remaining} 堂
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        <Button variant="primary" onClick={() => router.push('/booking')}>
          預約療程
        </Button>
        <Button variant="outline" onClick={() => router.push('/today')}>
          打卡
        </Button>
        <Button variant="outline" onClick={() => router.push('/services')}>
          服務列表
        </Button>
      </div>
    </main>
  );
}
