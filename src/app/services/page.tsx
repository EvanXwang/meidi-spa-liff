'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Service } from '@/types';
import { ServiceCard } from '@/components/ServiceCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Service[]>('/api/services')
      .then((data) => setServices(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-amber-50 p-4 pb-24 max-w-md mx-auto">
        <div className="pt-4 pb-2">
          <Link href="/dashboard" className="text-amber-700 font-medium flex items-center gap-1">
            ← 返回
          </Link>
        </div>
        <LoadingSpinner />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-amber-50 p-4 pb-24 max-w-md mx-auto">
        <div className="pt-4 pb-2">
          <Link href="/dashboard" className="text-amber-700 font-medium flex items-center gap-1">
            ← 返回
          </Link>
        </div>
        <p className="text-red-500">載入失敗：{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-amber-50 p-4 pb-24 max-w-md mx-auto">
      {/* Back link */}
      <div className="pt-4 pb-2">
        <Link href="/dashboard" className="text-amber-700 font-medium flex items-center gap-1">
          ← 返回
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-amber-700 mb-6">療程服務</h1>
      <div className="flex flex-col gap-4">
        {services.map((service) => (
          <ServiceCard
              key={service.id}
              service={service}
              onBook={(service) => {
                router.push(`/booking?serviceId=${service.id}`);
              }}
            />
        ))}
        {services.length === 0 && (
          <p className="text-gray-500">目前尚無療程服務。</p>
        )}
      </div>
    </main>
  );
}
