'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { Check, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Notifikasi (toast) sesuai DesignRuangFoto.md Bagian 4.10 */}
      <div
        className="fixed top-4 inset-x-4 sm:inset-x-auto sm:top-auto sm:bottom-6 sm:right-6 z-50 flex flex-col gap-3 max-w-md pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const bgClass =
            t.type === 'success'
              ? 'bg-rf-teal'
              : t.type === 'error'
                ? 'bg-rf-coral'
                : 'bg-rf-yellow';
          const IconComponent =
            t.type === 'success'
              ? Check
              : t.type === 'error'
                ? AlertTriangle
                : Info;

          return (
            <div
              key={t.id}
              role="status"
              className={`${bgClass} text-rf-ink border-3 border-rf-ink rounded-[12px] shadow-hard px-4 py-3 flex items-center justify-between gap-3 pointer-events-auto`}
            >
              <div className="flex items-center gap-3">
                <IconComponent
                  size={20}
                  strokeWidth={2.5}
                  aria-hidden="true"
                  className="shrink-0 text-rf-ink"
                />
                <span className="text-[14px] leading-[20px] font-bold text-rf-ink">
                  {t.message}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Tutup notifikasi"
                className="w-8 h-8 inline-flex items-center justify-center rounded-[8px] border-2 border-rf-ink bg-rf-white text-rf-ink hover:bg-rf-yellow transition-colors shrink-0"
              >
                <X size={16} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast harus dipakai di dalam ToastProvider');
  }
  return ctx;
}
