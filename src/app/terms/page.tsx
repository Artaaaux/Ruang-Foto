import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, FileText } from 'lucide-react';
import { RfBadge, RfCard } from '@/components/ui/NeoPrimitives';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-rf-bg text-rf-ink">
      <header className="w-full border-b-3 border-rf-ink bg-rf-bg sticky top-0 z-20">
        <div className="max-w-content mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-rf-ink no-underline"
          >
            <span className="w-10 h-10 rounded-[12px] bg-rf-coral border-3 border-rf-ink shadow-hard-sm flex items-center justify-center">
              <Camera size={20} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="text-[20px] font-bold text-rf-ink">RuangFoto</span>
          </Link>

          <Link href="/" className="rf-btn min-h-[44px] px-4 text-[14px]">
            <ArrowLeft size={18} strokeWidth={2.5} aria-hidden="true" />
            <span>Kembali</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-content w-full mx-auto px-4 sm:px-6 py-10 lg:py-16">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          <RfCard
            color="pink"
            panelCorner="tr"
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <RfBadge color="white">Ketentuan Layanan</RfBadge>
              <RfBadge color="teal">100% Gratis</RfBadge>
            </div>
            <h1 className="rf-h1 text-rf-ink">
              Syarat dan ketentuan RuangFoto
            </h1>
            <p className="rf-body text-rf-ink">
              Ketentuan penggunaan layanan photobooth jarak jauh RuangFoto bagi
              seluruh pengguna (Host maupun Guest).
            </p>
          </RfCard>

          <RfCard color="white" className="flex flex-col gap-6">
            <section className="flex flex-col gap-2">
              <h2 className="rf-h3 text-rf-ink">
                1. Layanan gratis dan donasi sukarela
              </h2>
              <p className="rf-body text-rf-muted">
                Seluruh fitur RuangFoto disediakan secara gratis. Tautan
                dukungan ke Saweria merupakan kotak donasi sukarela untuk
                membantu biaya operasional server, tidak mengikat, tidak dapat
                dikembalikan, dan tidak ditukar dengan barang, jasa, atau fitur
                tambahan apa pun.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="rf-h3 text-rf-ink">
                2. Peran Host, Guest, dan batas sesi
              </h2>
              <p className="rf-body text-rf-muted">
                Satu ruang sesi hanya dapat diikuti oleh maksimal 2 peserta
                (Host dan Guest) yang keduanya wajib masuk ke akun masing-masing.
                Sesuai aturan produk, hanya Host yang dapat mengunduh file hasil
                akhir photostrip. Setiap sesi dibatasi maksimal 15 menit agar
                kualitas jaringan tetap terjaga.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="rf-h3 text-rf-ink">
                3. Etika penggunaan dan batas penyimpanan
              </h2>
              <p className="rf-body text-rf-muted">
                Pengguna dilarang menyalahgunakan ruang sesi untuk konten yang
                melanggar hukum atau mengganggu kenyamanan pihak lain. Pengguna
                memahami bahwa foto akan terhapus otomatis setelah 1x24 jam dan
                RuangFoto tidak menyimpan cadangan foto setelah batas waktu
                tersebut berakhir.
              </p>
            </section>

            <div className="pt-4 border-t-2 border-rf-ink flex items-center gap-3 text-[14px] font-bold text-rf-ink">
              <FileText size={20} strokeWidth={2.5} aria-hidden="true" />
              <span>Berlaku efektif untuk seluruh sesi RuangFoto.</span>
            </div>
          </RfCard>
        </div>
      </main>
    </div>
  );
}
