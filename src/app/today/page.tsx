'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { TodayBooking } from '@/types/index';

export default function TodayPage() {
  const [booking, setBooking] = useState<TodayBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ newPoints: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ booking: TodayBooking | null }>('/api/today')
      .then((res) => setBooking(res.booking))
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '載入失敗，請稍後再試');
      })
      .finally(() => setLoading(false));
  }, []);

  // Time lock: can check in within ±2 hours of scheduled_start
  const canCheckIn =
    booking &&
    booking.status === 'booked' &&
    (() => {
      const start = new Date(booking.scheduled_start);
      const now = new Date();
      const diffMs = start.getTime() - now.getTime();
      return Math.abs(diffMs) <= 2 * 60 * 60 * 1000;
    })();

  async function handleCheckIn() {
    if (!booking) return;
    setChecking(true);
    setError(null);
    try {
      const res = await apiFetch<{ newPoints: number }>('/api/check-in', {
        method: 'POST',
        body: JSON.stringify({ bookingId: booking.id }),
      });
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '打卡失敗，請稍後再試');
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-amber-50 p-4 pb-24 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="pt-4 pb-2">
        <Link href="/dashboard" className="text-amber-700 font-medium flex items-center gap-1">
          ← 返回
        </Link>
        <h1 className="text-2xl font-bold text-amber-700 mt-2">今日打卡</h1>
      </div>

      {/* Error banner */}
      {error && (
        <Card>
          <p className="text-red-500 text-sm">{error}</p>
        </Card>
      )}

      {/* No booking */}
      {!booking && !error && (
        <Card>
          <p className="text-gray-500 text-center py-4">今日無預約</p>
        </Card>
      )}

      {/* Booking card */}
      {booking && (
        <Card>
          <h2 className="text-base font-semibold text-gray-800 mb-3">今日預約</h2>

          <div className="space-y-1 mb-5">
            <p className="text-lg font-medium text-gray-900">{booking.service.name}</p>
            <p className="text-sm text-gray-500">
              {format(parseISO(booking.scheduled_start), 'HH:mm')}
              {' - '}
              {format(parseISO(booking.scheduled_end), 'HH:mm')}
            </p>
            {booking.therapist && (
              <p className="text-sm text-gray-500">
                {booking.therapist.name}
                {booking.therapist.title ? ` ${booking.therapist.title}` : ''}
              </p>
            )}
          </div>

          {/* Check-in result */}
          {result ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
              <p className="text-green-700 font-semibold text-base">
                已打卡 ✓ +{result.newPoints} 點
              </p>
            </div>
          ) : canCheckIn ? (
            <Button
              variant="primary"
              disabled={checking}
              onClick={handleCheckIn}
              className="w-full py-3 text-base"
            >
              {checking ? '打卡中…' : '打卡'}
            </Button>
          ) : (
            <p className="text-center text-sm text-gray-400">
              不在打卡時間範圍（預約前後 2 小時）
            </p>
          )}
        </Card>
      )}
    </main>
  );
}
