'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PhotoboothResult } from '@/lib/types';
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
          <Link
            href="/app"
            className="inline-flex items-center gap-2.5 text-rf-ink no-underline"
          >
            <span className="w-10 h-10 rounded-[12px] bg-rf-coral border-3 border-rf-ink shadow-hard-sm flex items-center justify-center">
              <Camera size={20} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="text-[24px] font-bold text-rf-ink">RuangFoto</span>
          </Link>

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
