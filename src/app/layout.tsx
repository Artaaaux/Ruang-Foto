import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RuangFoto — Photobooth Jarak Jauh Gratis',
  description:
    'Foto bareng, walau beda kota. Photobooth online gratis dengan video langsung dan hitungan mundur tersinkron untuk kamu dan pasanganmu.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={spaceGrotesk.variable}>
      <body className="min-h-screen bg-rf-bg text-rf-ink font-sans antialiased selection:bg-rf-yellow selection:text-rf-ink">
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
