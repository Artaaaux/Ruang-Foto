# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, TypeScript, Tailwind CSS) + Supabase (Auth, PostgreSQL, Storage, Realtime) + HTML5 Canvas + WebRTC P2P (Supabase Realtime / BroadcastChannel + STUN/TURN) dengan Mode Lokal/Demo otomatis untuk pengujian end-to-end tanpa kredensial eksternal serta Mode Simulasi Pasangan.

## Users

- **Utama:** Pasangan hubungan jarak jauh (LDR) usia 17–30 tahun di Indonesia yang ingin berfoto bersama ala photobooth tanpa harus berada di kota yang sama dan tanpa mengedit manual.
- **Sekunder:** Sahabat, keluarga, atau teman kuliah/kerja yang terpisah jarak dan ingin membuat kenangan photostrip bersama secara online.
- **Dua peran dalam sesi:**
  - **Host:** Membuat sesi, memilih template photostrip, mengundang pasangan lewat link, dan satu-satunya yang bisa mengunduh hasil akhir.
  - **Guest:** Membuka link undangan, wajib login, ikut berfoto secara sinkron lewat kamera masing-masing, dan melihat hasil akhir tanpa tombol unduh.

## Product Purpose

RuangFoto adalah aplikasi web photobooth jarak jauh gratis tempat dua orang di lokasi berbeda saling melihat lewat video langsung (WebRTC peer-to-peer), lalu memotret serempak dari kamera perangkat masing-masing lewat hitungan mundur (countdown 3-2-1) yang tersinkron. Foto kedua peserta digabung otomatis ke dalam template photostrip di browser dan dapat diunduh kualitas HD (1080p) oleh host. Keberhasilan diukur dari kemudahan menyelesaikan sesi dalam waktu < 5 menit sejak login dengan rasa kebersamaan layaknya photobooth fisik.

## Positioning

Photobooth jarak jauh berbahasa Indonesia yang sepenuhnya gratis, menyatukan video langsung dua arah tanpa rekaman (privasi terjaga) dengan jepretan kamera lokal beresolusi penuh yang digabung otomatis ke template photostrip di browser, didukung murni lewat donasi sukarela Saweria tanpa mengunci fitur apa pun.

## Operating Context

- Digunakan di browser HP (mobile-first: Chrome Android, Safari iOS) maupun desktop (Chrome, Edge).
- Alur utama: Landing Page (`/`) → Login (`/login`) → Halaman Utama (`/app` dengan tab Photobooth, Template, Dukung RuangFoto) → Ruang Sesi (`/app/session/[kode]`) → Layar Hasil (`/app/result/[id]`).
- Di ruang sesi, kedua pengguna saling berbicara dan mengatur gaya melalui video langsung sambil melihat indikator pose dan countdown 3-2-1.

## Capabilities and Constraints

- **100% Gratis & Tanpa Paywall:** Tidak ada sistem pembayaran, paket berbayar, atau fitur/template terkunci. Tautan dukungan ke Saweria bersifat sukarela murni dan tidak membuka fitur apa pun.
- **Privasi Video & Foto:** Aliran video langsung tidak pernah direkam atau disimpan. Hanya foto jepretan yang diunggah dan seluruh foto/hasil otomatis kedaluwarsa serta dihapus dalam 1x24 jam setelah sesi selesai (dilengkapi banner hitung mundur).
- **Wajib Login:** Halaman utama (`/app`), ruang sesi (`/app/session/[kode]`), dan layar hasil (`/app/result/[id]`) wajib login (Google OAuth atau Email + Kata Sandi dengan verifikasi email saat pendaftaran pertama).
- **Hak Unduh:** Hanya Host yang dapat mengunduh hasil photostrip (PNG/JPG kualitas HD 1080p, tanpa batas jumlah unduhan). Guest hanya melihat hasil.
- **Pose & Foto Ulang:** Jumlah pose mengikuti template (3 atau 4 pose); peserta dapat mengulang foto tanpa batas.
- **3 Template Awal Gratis:** Tersedia 3 template gratis saat rilis (kategori Retro, Romantis, Ceria) yang menentukan jumlah pose, warna bingkai, dan tata letak photostrip.
- **Batas Sesi:** Batas durasi sesi 15 menit dan penutupan otomatis sesi menganggur untuk menjaga pemakaian bandwidth.

## Brand Commitments

- **Nama Produk:** RuangFoto
- **Arah Visual Mengikat:** Retro Neo-Brutalism sesuai `DesignRuangFoto.md` dan `Design.jpg`:
  - Palet warna wajib: `bg` (`#FFF3EA`), `ink` (`#1A1A1A`), `muted` (`#4A4A4A`), `white` (`#FFFFFF`), `coral` (`#FF5C5C`), `purple` (`#A78BFA`), `teal` (`#36CFC0`), `yellow` (`#FFE066`), `orange` (`#F59E5B`), `blue` (`#3BA7D9`), `pink` (`#FFC9C4`).
  - Tipografi tunggal: **Space Grotesk** (400, 500, 700).
  - Border tegas `3px solid #1A1A1A` (`2px` untuk badge/chip, `4px` untuk tile video & countdown), bayangan keras tanpa blur (`3px`, `4px`, `6px`), tanpa gradien, tanpa kaca buram.
  - Ikon: `lucide-react` dengan `strokeWidth={2.5}` (dilarang memakai emoji sebagai ikon).
  - Suara tulisan (copy): Bahasa Indonesia santai dan ramah dengan sapaan "kamu", kalimat biasa (sentence case), satu tombol utama (`coral`) per layar, tanpa tanda panah pada teks tombol.

## Evidence on Hand

- `PRDRuangFoto.md`: Spesifikasi kebutuhan fungsional dan non-fungsional lengkap.
- `DesignRuangFoto.md`: Spesifikasi token desain, komponen, tata letak per rute, copywriting, dan daftar periksa aksesibilitas.
- `Design.jpg`: Referensi visual komponen Retro Neo-Brutalism.

## Product Principles

1. **Kebersamaan Tanpa Jarak:** Sesi video langsung dan hitungan mundur tersinkron harus terasa responsif, hangat, dan nyata seperti berada di bilik foto yang sama.
2. **Privasi Tanpa Kompromi:** Video tidak pernah direkam, foto hanya bertahan 1x24 jam dengan transparansi penuh kepada pengguna.
3. **Kejujuran Model Gratis:** Semua pengguna mendapatkan pengalaman penuh dan kualitas HD tanpa jebakan biaya; dukungan komunitas di Saweria murni sukarela.
4. **Disiplin Visual Retro Neo-Brutalism:** Setiap komponen tampil berani dengan garis tegas dan kontras tinggi, namun tetap tenang saat sesi berlangsung agar photostrip dan wajah pasangan menjadi pusat perhatian.

## Accessibility & Inclusion

- Target sentuh minimal 44×44px (tombol utama minimal tinggi 48px, kontrol sesi 56×56px).
- Kontras teks selalu menggunakan `ink` (`#1A1A1A`) di atas seluruh warna palet.
- Status mikrofon, kamera, dan koneksi tidak pernah hanya mengandalkan warna—selalu disertai ikon dan label teks.
- Dukungan penuh navigasi keyboard (`focus-visible` dengan outline 3px `#1A1A1A`), pembaca layar (`aria-live="assertive"` pada countdown, `role="tablist"` pada tab), serta penghormatan terhadap `prefers-reduced-motion: reduce`.
