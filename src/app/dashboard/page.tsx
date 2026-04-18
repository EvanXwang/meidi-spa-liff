'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { AuthContext } from '@/providers/AuthProvider';

export default function DashboardPage() {
  const { userId, displayName, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-amber-700">美的原點 Spa 仕女館</h1>
      <p className="mt-2 text-gray-600">歡迎，{displayName}</p>
      <p className="mt-1 text-xs text-gray-400">userId: {userId}</p>
      <Link href="/services" className="mt-4 inline-block text-amber-700 hover:text-amber-900 font-medium">
        查看療程 →
      </Link>
    </main>
  );
}
