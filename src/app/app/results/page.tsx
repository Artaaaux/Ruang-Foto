'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PhotoboothResult } from '@/lib/types';
import { RfLogo } from '@/components/ui/NeoPrimitives';
import { ResultsGallerySection } from '@/components/ruangfoto/DomainComponents';

export default function ResultsListPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [results, setResults] = useState<PhotoboothResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/app/results');
    }
  }, [authLoading, user, router]);

  const fetchResults = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/results?userId=${encodeURIComponent(user.id)}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data.results)) {
        setResults(data.results);
      }
    } catch {
      // Ignore fetch error
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchResults();
    }
  }, [user?.id, fetchResults]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-rf-bg flex items-center justify-center font-bold text-rf-ink">
        Memproses…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-rf-bg text-rf-ink">
      <header className="w-full border-b-3 border-rf-ink bg-rf-bg sticky top-0 z-20">
        <div className="max-w-content mx-auto px-4 sm:px-6 h-18 py-3 flex items-center justify-between gap-4">
          <RfLogo href="/app" size="md" />

          <Link href="/app" className="rf-btn min-h-[44px] px-4 text-[14px]">
            <ArrowLeft size={18} strokeWidth={2.5} aria-hidden="true" />
            <span>Halaman utama</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-content w-full mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <ResultsGallerySection
          results={results}
          loading={loading}
          currentUserId={user.id}
          onRefresh={fetchResults}
          onDeleted={(deletedId) =>
            setResults((prev) => prev.filter((item) => item.id !== deletedId))
          }
          onStartNewSession={() => router.push('/app')}
        />
      </main>
    </div>
  );
}
