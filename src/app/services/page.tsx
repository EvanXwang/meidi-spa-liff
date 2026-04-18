'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <main className="p-6">
        <p className="text-red-500">載入失敗：{error}</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-amber-700 mb-6">「療程服務」</h1>
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
