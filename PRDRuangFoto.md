# PRD RuangFoto

**Produk:** RuangFoto – Photobooth Jarak Jauh **Status:** Final untuk MVP: gratis, video langsung dan foto, desain Retro Neo-Brutalism

---

## 0. Panduan Membaca (untuk manusia dan AI)

**Ringkasan:** RuangFoto adalah aplikasi web gratis (Next.js + Supabase) tempat dua orang di lokasi berbeda saling melihat lewat video langsung (WebRTC peer-to-peer), lalu berfoto serempak ala photobooth. Foto digabung ke template di browser dan diunduh oleh host. Semua foto terhapus otomatis setelah 1x24 jam. Pendanaan hanya lewat donasi sukarela di Saweria.

**Aturan yang tidak boleh dilanggar:**

- Jangan membuat sistem pembayaran, paket, atau fitur berbayar. Donasi Saweria hanya berupa tautan dan tidak membuka fitur apa pun.
- Video tidak boleh direkam atau disimpan. Hanya foto yang diunggah.
- Foto dan hasil gabungan dihapus otomatis 1x24 jam setelah sesi selesai.
- Hanya host yang bisa mengunduh; guest hanya melihat hasil.
- Halaman utama dan ruang sesi wajib login, untuk host maupun guest.
- Tampilan mengikuti berkas design.md (Retro Neo-Brutalism).

**Istilah:**

| Istilah | Arti |
| --- | --- |
| Host | Pengguna yang membuat sesi, memilih template, dan mengunduh hasil |
| Guest | Pengguna yang diundang lewat link; ikut berfoto, tidak bisa mengunduh |
| Sesi | Satu ruang photobooth untuk dua orang, dibuat host |
| Pose | Satu kali pengambilan foto dalam sesi; jumlahnya ditentukan template |
| Template | Bingkai dan layout photostrip yang menentukan jumlah pose dan posisi foto |
| Hasil | Gambar akhir hasil penggabungan foto kedua orang ke dalam template |
| Dukungan | Donasi sukarela lewat Saweria; tidak ditukar fitur |

**Penanda status:** kata "usulan" atau "asumsi" berarti belum final; "cadangan" berarti rencana jika opsi utama gagal; selain itu berarti keputusan pemilik produk.

**Daftar kebutuhan:**

| ID | Kebutuhan | Bagian |
| --- | --- | --- |
| FR-01 | Landing page berisi info produk, rincian jasa, dan ajakan dukungan | 7.1 |
| FR-02 | Login Google dan email (kata sandi, verifikasi email saat daftar pertama) | 7.2 |
| FR-03 | Halaman utama wajib login dengan tab Photobooth, Template, Dukung RuangFoto | 7.3 |
| FR-04 | Host membuat sesi dan link undangan; guest wajib login | 7.3 A |
| FR-05 | Video langsung dua arah (WebRTC peer-to-peer) dengan tombol nyala/mati suara dan kamera | 7.3 A, 11 |
| FR-06 | Countdown tersinkron; foto diambil dari kamera lokal dan diunggah otomatis | 6, 7.3 A |
| FR-07 | Jumlah pose sesuai template; foto ulang tanpa batas | 7.3 A |
| FR-08 | Foto digabung ke template di browser dan tampil di layar hasil | 7.3 A |
| FR-09 | Hanya host yang mengunduh hasil; kualitas HD (1080p); unduhan tanpa batas | 7.3 A |
| FR-10 | Penghapusan otomatis 1x24 jam dengan peringatan dan hitung mundur | 7.3 A, 10 |
| FR-11 | Galeri template; 3 template gratis saat rilis | 7.3 B |
| FR-12 | Tab Dukung RuangFoto berisi tautan ke Saweria, tanpa menukar fitur | 7.3 C, 8 |
| NFR-01 | Mobile-first; Chrome, Safari iOS, dan Edge versi terbaru | 9 |
| NFR-02 | Video tidak direkam; foto privat; seluruh lalu lintas HTTPS | 10 |
| NFR-03 | Batas durasi sesi (usulan 15 menit); sesi menganggur ditutup otomatis | 7.3 A, 8 |

**Urutan pengerjaan:** ikuti roadmap di bagian 16. Kerjakan video dua orang lebih dulu karena paling berisiko.

## 1. Ringkasan Produk

RuangFoto adalah aplikasi web **gratis** untuk berfoto ala photobooth bersama orang yang berada di tempat berbeda. Dua orang masuk ke satu sesi lewat link undangan, lalu masing-masing mengambil foto dari kamera sendiri pada saat yang sama lewat countdown yang tersinkron. Foto keduanya digabung otomatis ke template photostrip. Selama sesi, kedua orang saling melihat lewat video langsung agar terasa berfoto bersama; video tidak direkam.

**Target utama:** pasangan atau sahabat yang menjalani hubungan jarak jauh (LDR) dan ingin punya momen photobooth bersama.

**Nilai jual (3 pilar):**

1. Foto jarak jauh (fitur utama)
2. Template yang menarik
3. Gratis, dengan dukungan seikhlasnya lewat Saweria

## 2. Latar Belakang dan Masalah

- Photobooth konvensional mengharuskan semua orang berada di satu tempat.
- Pasangan LDR sulit mendapat foto bersama yang terasa "jadi satu". Pilihan yang ada (screenshot video call, edit manual di aplikasi lain) kualitasnya rendah dan ribet.
- Belum ada layanan sederhana, berbahasa Indonesia, dan gratis yang fokus pada pengalaman photobooth jarak jauh.

## 3. Tujuan dan Metrik Keberhasilan

### Tujuan produk

- Pengguna menyelesaikan satu sesi photobooth jarak jauh dalam waktu kurang dari 5 menit sejak login.
- Hasil foto terasa seperti photobooth sungguhan (countdown, beberapa pose, photostrip).
- Biaya operasional terkendali: video hanya mengalir selama sesi, foto disimpan sementara.

### Metrik (usulan)

| Metrik | Target awal |
| --- | --- |
| Konversi pengunjung landing page → daftar | ≥ 10% |
| Pengguna yang menyelesaikan sesi pertama | ≥ 60% dari yang membuat sesi |
| Sesi berhasil (semua foto dari kedua sisi masuk) | ≥ 90% |
| Waktu tunggu hasil setelah foto terakhir | < 15 detik |
| Pengguna yang menekan tombol dukungan | Hanya dipantau, tanpa target |

## 4. Target Pengguna

### Persona utama: pasangan LDR

- Usia 17–30 tahun, aktif di Instagram/TikTok.
- Ingin foto yang bisa disimpan dan dibagikan, tanpa ribet mengedit.
- Sensitif terhadap harga, jadi gratis menjadi daya tarik utama.

### Persona sekunder

- Sahabat atau keluarga yang terpisah kota atau negara.
- Teman kuliah atau kerja yang ingin foto bersama secara online.

### Dua peran dalam satu sesi

- **Host:** wajib login, membuat sesi, memilih template, dan satu-satunya yang bisa mengunduh hasil foto.
- **Guest:** diundang host lewat link undangan, wajib login, ikut mengambil foto, dan bisa melihat hasil, tetapi tidak bisa mengunduh.

Tidak ada peran yang membayar apa pun.

## 5. Ruang Lingkup

### MVP (wajib ada)

- Landing page: informasi produk, rincian jasa, dan ajakan dukungan seikhlasnya.
- Login Google dan email (kata sandi, dengan verifikasi email saat daftar pertama kali).
- Halaman utama (wajib login): photobooth jarak jauh, pemilihan template, halaman dukungan.
- Undangan guest lewat link.
- Video langsung dua arah selama sesi (tanpa rekaman).
- Hasil foto bisa diunduh oleh host.
- Penghapusan otomatis semua foto setelah 1x24 jam, dengan peringatan.
- 3 template saat peluncuran.

### Di luar cakupan (untuk saat ini)

- Perekaman atau penyimpanan video.
- Paket berbayar, template berbayar, dan sistem pembayaran.
- Galeri atau riwayat foto (foto dihapus setelah 1x24 jam).
- Sesi lebih dari 2 orang, filter, stiker, dan editor foto lanjutan.
- Cetak fisik dan pengiriman.

## 6. Cara Kerja Foto Jarak Jauh

Selama sesi, kedua orang saling melihat lewat video langsung. Saat foto diambil, setiap orang memotret dari kamera di perangkatnya sendiri (bukan tangkapan layar video), dan sistem menyamakan waktunya.

1. Host membuat sesi dan membagikan link undangan.
2. Guest membuka link, login, dan mengizinkan kamera serta mikrofon. Keduanya langsung saling melihat lewat video langsung.
3. Keduanya menekan "Siap". Sistem memulai countdown 3-2-1 yang sama di kedua sisi, berdasarkan sinyal waktu dari server.
4. Saat countdown mencapai nol, kamera masing-masing mengambil foto beresolusi penuh (bukan tangkapan layar video), lalu foto diunggah otomatis.
5. Langkah 3–4 diulang sesuai jumlah pose pada template.
6. Setelah semua foto kedua sisi masuk, foto digabung ke template dan hasilnya tampil di kedua sisi.
7. Host mengunduh hasil. Semua foto terhapus otomatis setelah 1x24 jam; video tidak pernah disimpan.

Video langsung dipakai agar peserta bisa saling melihat dan mengobrol saat berpose. Video tidak direkam dan tidak disimpan.

**Alur halaman:** Landing page → Login → Halaman utama

## 7. Kebutuhan Fungsional

### 7.1 Landing Page

**Tujuan:** meyakinkan pengunjung dan mengarahkan mereka ke login.

**Konten wajib:**

- Hero: nama produk, tagline, tombol ajakan (CTA) "Mulai Sekarang".
- Cara kerja dalam 3–4 langkah.
- Rincian jasa: **foto jarak jauh** (fitur utama), **template yang menarik**, dan **gratis**.
- Bagian "Gratis, dukung seikhlasnya" yang menggantikan pricing, dengan tombol ke Saweria.
- Contoh hasil foto.
- FAQ singkat, termasuk "kenapa gratis" dan "kenapa foto dihapus setelah 1x24 jam".
- Footer: kontak, kebijakan privasi, syarat dan ketentuan.

**Kriteria penerimaan:**

- Semua tombol CTA mengarah ke halaman login (atau langsung ke halaman utama jika sudah login).
- Halaman tampil baik di HP maupun desktop.
- Teks dukungan menyebut jelas bahwa dukungan bersifat sukarela dan tidak membuka fitur apa pun.

### 7.2 Halaman Login

**Opsi login:** Google (satu klik) dan email.

**Kebutuhan:**

- Daftar dengan email dan kata sandi, lalu verifikasi email lewat tautan yang dikirim ke inbox. Akun aktif setelah terverifikasi.
- Verifikasi hanya saat daftar pertama kali; login berikutnya cukup email dan kata sandi.
- Login Google tidak butuh verifikasi tambahan.
- Fitur lupa kata sandi (reset lewat email).
- Pesan error yang jelas (email salah, akun sudah ada, email belum diverifikasi).
- Setelah login, pengguna masuk ke halaman utama. Pengguna yang belum login tidak bisa membuka halaman utama maupun ruang sesi.
- Jika datang dari link undangan, setelah login atau daftar pengguna kembali ke sesi tersebut.

**Kriteria penerimaan:**

- Login Google dan email berhasil, dan email yang sama tidak membuat dua akun.
- Sesi login tersimpan (tidak perlu login ulang setiap kali).
- Ada tombol keluar.

### 7.3 Halaman Utama

Tiga bagian dalam tab: **Photobooth**, **Template**, dan **Dukung RuangFoto**.

#### A. Photobooth

**Alur host:**

1. Pilih template.
2. Tekan "Buat Sesi"; sistem membuat ruang sesi dan link undangan.
3. Bagikan link (WhatsApp, Instagram, dll.).
4. Tunggu guest masuk; status tampil real-time.

**Alur guest:** buka link → login → izinkan kamera dan mikrofon → masuk ruang sesi.

**Di dalam ruang sesi:**

- Video langsung pasangan dan kamera sendiri tampil berdampingan, di slot sesuai layout template.
- Tombol nyala/mati suara (mikrofon) dan tombol nyala/mati kamera, masing-masing dengan indikator status yang jelas.
- Tombol "Siap" untuk masing-masing pihak; countdown mulai saat keduanya siap.
- Jumlah pose mengikuti template (misalnya 3 atau 4).
- Foto ulang tanpa batas: pengguna bisa mengulang satu pose atau seluruh sesi.
- Layar hasil: foto digabung ke template. Host punya tombol **Unduh**; keduanya punya **Foto Ulang**.

**Kebutuhan teknis:**

- Video langsung dua arah memakai WebRTC peer-to-peer buatan sendiri: kedua browser terhubung langsung. Pertukaran data koneksi (sinyal) lewat Supabase Realtime atau PeerJS, ditambah server STUN dan server TURN sebagai cadangan agar tetap tersambung di jaringan yang ketat.
- Foto diambil dari kamera lokal perangkat masing-masing pada resolusi penuh, bukan dari aliran video, lalu diunggah ke penyimpanan privat; penggabungan dilakukan di browser (Canvas).
- Sinyal Siap, countdown, dan status foto masuk lewat kanal real-time.
- Kualitas video menyesuaikan koneksi secara otomatis.
- Batas durasi sesi (usulan 15 menit) dan sesi menganggur ditutup otomatis untuk menjaga biaya bandwidth TURN.
- Putus koneksi: video mencoba tersambung ulang otomatis, dan foto yang sudah terunggah tetap aman.
- Jika salah satu pihak belum mengunggah foto dalam batas waktu (usulan 15 detik), sistem menawarkan mengulang pose itu.

**Kriteria penerimaan:**

- Dua pengguna di jaringan berbeda saling melihat lewat video dan bisa menyelesaikan sesi sampai hasil muncul.
- Video terasa wajar untuk mengobrol (usulan: tertunda kurang dari 1 detik).
- Selisih waktu jepret antara dua sisi kurang dari 1 detik (usulan).
- Jika izin kamera atau mikrofon ditolak, muncul panduan mengaktifkannya.
- Hanya host yang melihat dan bisa memakai tombol Unduh.

**Unduh hasil dan penghapusan otomatis:**

- Hanya host yang bisa mengunduh (JPG atau PNG). Semua pengguna mendapat kualitas HD (1080p) dan tanpa batas jumlah unduhan.
- Semua foto dihapus otomatis 1x24 jam setelah sesi selesai.
- Peringatan wajib: layar hasil menampilkan hitung mundur dan pesan "foto akan terhapus dalam 1x24 jam, silakan unduh". Usulan tambahan: pengingat lewat email sebelum foto terhapus.

#### B. Pemilihan Template

- Galeri template dengan pratinjau dan kategori sederhana (misalnya Romantis, Ceria, Minimalis, Retro).
- Saat peluncuran tersedia **3 template**, semuanya gratis; template lain menyusul.
- Pratinjau memakai foto contoh sebelum dipilih.
- Template yang dipilih otomatis dipakai di sesi berikutnya.
- Template menentukan jumlah pose, layout (vertikal/horizontal), bingkai, dan warna latar.
- Usulan struktur template (belum diputuskan): satu gambar bingkai PNG transparan dan satu file konfigurasi yang menentukan posisi dan ukuran tiap foto, sehingga menambah template cukup menambah dua file.

**Kriteria penerimaan:** pengguna bisa memilih template dan langsung memakainya di photobooth.

#### C. Dukung RuangFoto

- Penjelasan singkat bahwa RuangFoto gratis dan dukungan seikhlasnya membantu biaya server.
- Tombol yang membuka halaman Saweria di tab baru.
- Dukungan bersifat sukarela murni: tidak membuka fitur, template, atau kualitas apa pun. Ini penting agar sesuai syarat Saweria.
- Tidak ada integrasi webhook atau pelacakan donasi di MVP.

## 8. Model Bisnis: Gratis dan Donasi

- Semua fitur gratis untuk semua pengguna.
- Saweria dipakai hanya sebagai kotak donasi sukarela. Syarat Saweria menyebut dukungan bersifat sukarela, tidak ditukar barang atau jasa, dan tidak dapat dikembalikan.
- Karena itu donasi tidak boleh ditukar fitur apa pun. Jika donasi membuka fitur, penggunaannya berubah menjadi jual beli dan berisiko melanggar syarat Saweria.
- Jika suatu saat ingin berbayar, gunakan payment gateway yang mengizinkan penjualan layanan. Jangan memakai Saweria untuk itu.
- Video dibangun sendiri secara peer-to-peer, sehingga tidak ada biaya per menit ke penyedia layanan video. Biaya video utama adalah server TURN (sewa VPS dan bandwidth), yang hanya terpakai saat koneksi langsung gagal.
- Pengendalian biaya: batas durasi sesi (usulan 15 menit), sesi menganggur ditutup otomatis, tidak ada rekaman video, foto dihapus setelah 1x24 jam, dan bandwidth TURN dipantau.
- Tidak apa-apa jika sedikit pengguna yang berdonasi; model ini dijalankan dulu tanpa target pemasukan.

## 9. Kebutuhan Non-Fungsional

- **Performa:** halaman dimuat < 3 detik di jaringan 4G; video langsung lancar di jaringan 4G, unggah foto cepat, dan hasil gabungan tampil < 15 detik.
- **Kompatibilitas:** Chrome, Safari (iOS), dan Edge versi terbaru, di HP maupun desktop. Safari iOS perlu pengujian khusus karena aturan kamera lebih ketat.
- **Responsif:** mobile-first.
- **Ketersediaan:** target uptime 99%.
- **Bahasa:** Bahasa Indonesia (Inggris menyusul).
- **Aksesibilitas:** teks terbaca jelas, tombol cukup besar untuk disentuh.

## 10. Privasi dan Keamanan

Karena aplikasi memakai kamera dan menyimpan foto pribadi:

- Akses kamera dan mikrofon hanya diminta saat masuk sesi, dengan penjelasan yang jelas.
- Video langsung hanya mengalir antar peserta selama sesi dan tidak direkam atau disimpan; hanya foto hasil jepretan yang diunggah.
- Foto disimpan privat dan dihapus otomatis 1x24 jam setelah sesi selesai, dengan peringatan sebelumnya.
- Link sesi unik, sulit ditebak, dan kedaluwarsa setelah sesi berakhir.
- Sesi dibatasi 2 peserta.
- Tautan unduhan bersifat sementara.
- Pengguna bisa menghapus foto lebih awal dan menghapus akunnya.
- Kebijakan Privasi dan Syarat dan Ketentuan wajib tersedia sebelum peluncuran, sesuai UU Pelindungan Data Pribadi (UU PDP).
- Seluruh lalu lintas memakai HTTPS; kata sandi di-hash, tidak disimpan polos.

## 11. Arsitektur dan Teknologi (Rekomendasi)

Rekomendasi ini dipilih agar sedikit konfigurasi dan banyak layanan siap pakai, supaya mudah dibantu AI coding tools. Ini usulan, bukan keharusan.

| Lapisan | Rekomendasi | Alasan |
| --- | --- | --- |
| Frontend dan backend ringan | Next.js (React) | Satu proyek untuk halaman dan API, dokumentasi melimpah |
| Autentikasi, database, penyimpanan foto | Supabase (Auth, PostgreSQL, Storage) | Login Google dan email sudah tersedia, penyimpanan foto sekalian |
| Sinyal real-time (Siap, countdown, status foto) | Supabase Realtime | Menyamakan waktu jepret antar pengguna |
| Penggabungan foto ke template | HTML5 Canvas di browser | Cepat, tanpa beban server |
| Penghapusan otomatis 1x24 jam | Tugas terjadwal (misalnya cron di Supabase) | Menghapus foto kedaluwarsa tanpa kerja manual |
| Email verifikasi dan pengingat | Resend atau email bawaan Supabase | Verifikasi dan notifikasi |
| Hosting | Vercel | Deploy mudah |
| Dukungan | Tautan ke halaman Saweria | Tanpa integrasi teknis |
| Video langsung dua arah | WebRTC peer-to-peer buatan sendiri (sinyal lewat Supabase Realtime atau PeerJS) + server STUN/TURN | Tanpa biaya per menit; TURN (misalnya coturn di VPS) dibutuhkan agar tersambung di jaringan ketat |

Video dibangun sendiri secara peer-to-peer. Server STUN publik membantu dua browser saling menemukan, dan server TURN (misalnya coturn di VPS, atau layanan TURN terkelola) dibutuhkan sebagai cadangan agar video tetap tersambung di jaringan yang ketat. Bandwidth TURN adalah biaya video yang perlu dipantau. Jika membangun sendiri terbukti terlalu sulit atau tidak stabil, cadangannya adalah beralih ke layanan video terkelola seperti LiveKit atau Daily.

## 12. Model Data (Garis Besar)

- **users:** id, nama, email, metode login, foto profil, tanggal daftar.
- **templates:** id, nama, kategori, jumlah pose, konfigurasi layout, gambar bingkai.
- **sessions:** id, kode/link unik, host, guest, template, status (menunggu / berjalan / selesai / kedaluwarsa), waktu mulai dan selesai.
- **photos:** id, sesi, urutan pose, pemilik, alamat penyimpanan, waktu kedaluwarsa (1x24 jam).
- **results:** id, sesi, gambar hasil akhir, waktu kedaluwarsa.

## 13. Halaman dan Rute

| Rute | Halaman | Akses |
| --- | --- | --- |
| / | Landing page | Publik |
| /login | Login (Google dan email) | Publik |
| /app | Halaman utama (tab Photobooth, Template, Dukung RuangFoto) | Wajib login |
| /app/session/\[kode\] | Ruang sesi photobooth | Wajib login |
| /app/result/\[id\] | Hasil foto | Wajib login |
| /privacy, /terms | Kebijakan privasi, syarat dan ketentuan | Publik |

## 14. Analitik

- Kunjungan landing page dan klik CTA.
- Pendaftaran dan login (per metode: Google/email).
- Sesi dibuat, link dibagikan, guest bergabung.
- Sesi selesai, foto diunduh, jumlah pengulangan foto.
- Klik tombol dukungan Saweria.
- Error unggah foto dan izin kamera ditolak.

## 15. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Video putus-putus atau tertunda, pengalaman terasa kurang "bersama" | Pengguna kecewa | Server TURN sebagai cadangan, kualitas video menyesuaikan koneksi, pesan koneksi yang jelas |
| Jepretan dua sisi tidak serempak karena koneksi | Foto kurang pas | Countdown berbasis waktu server, tawarkan ulang pose |
| Safari iOS membatasi kamera | Sebagian pengguna tidak bisa memakai | Uji sejak awal di iPhone dan sediakan panduan |
| Biaya penyimpanan tanpa pemasukan | Beban biaya naik | Hapus foto 1x24 jam; pantau penggunaan penyimpanan |
| Donasi sedikit | Biaya tidak tertutup | Jalankan sebagai tahap awal; evaluasi model bisnis setelah ada pengguna |
| Foto terhapus sebelum diunduh | Pengguna kehilangan foto | Peringatan jelas, hitung mundur, pengingat email |
| Isu privasi foto pribadi | Hilang kepercayaan | Foto privat, hapus otomatis, kebijakan privasi jelas |
| Konten tidak pantas di sesi | Reputasi | Link privat dan terbatas 2 peserta, tombol lapor |
| Bandwidth TURN membengkak karena gratis | Pengeluaran tinggi tanpa pemasukan | Batas durasi sesi, tutup sesi menganggur, pantau pemakaian menit, siapkan rencana pembatasan atau paket berbayar lewat payment gateway |
| Membangun video sendiri lebih sulit dari perkiraan (koneksi gagal, perbedaan Safari iPhone) | Pengerjaan lama dan pengalaman pengguna buruk | Uji sedini mungkin di banyak jaringan dan perangkat; siapkan layanan video terkelola (LiveKit atau Daily) sebagai rencana cadangan |

## 16. Roadmap (Usulan)

1. **Fase 1 – Fondasi:** setup proyek, autentikasi (Google + email), database.
2. **Fase 2 – Sesi dan video langsung:** sesi dan undangan, WebRTC peer-to-peer (sinyal, STUN, TURN), kamera dan mikrofon dengan tombol nyala/mati, batas durasi sesi; uji sedini mungkin karena paling berisiko.
3. **Fase 3 – Photobooth inti:** sinyal real-time, countdown tersinkron, ambil dan unggah foto, penggabungan template.
4. **Fase 4 – Template dan hasil:** 3 template, layar hasil, unduh oleh host, penghapusan otomatis, peringatan.
5. **Fase 5 – Landing dan dukungan:** landing page, halaman Dukung RuangFoto, kebijakan privasi.
6. **Fase 6 – Uji dan rilis:** uji video lintas jaringan dan perangkat (terutama iPhone), perbaikan, beta terbatas.
7. **Fase 7 – Setelah rilis:** evaluasi biaya video dan donasi, tambah template, pertimbangkan model berbayar lewat payment gateway.

Urutan ini menaruh **photobooth inti lebih dulu**, karena itu bagian paling berisiko dan menjadi nilai utama produk.

## 17. Keputusan dan Pertanyaan Terbuka

### Sudah diputuskan

| Hal | Keputusan |
| --- | --- |
| Model bisnis | Gratis; Saweria hanya donasi seikhlasnya, tidak ditukar fitur |
| Video | Ada; video langsung antar peserta selama sesi, tidak direkam |
| Akses | Halaman utama wajib login, untuk host maupun guest |
| Unduhan | Hanya host |
| Penyimpanan foto | Dihapus otomatis 1x24 jam, dengan peringatan |
| Login email | Kata sandi, verifikasi email saat daftar pertama kali |
| Pose dan foto ulang | Pose sesuai template; foto ulang tanpa batas |
| Template saat rilis | 3 template, semuanya gratis |
| Pembayaran | Ditunda; tidak ada di MVP |
| Kualitas foto | HD (1080p) untuk semua pengguna, unduhan tanpa batas |
| Batas pemakaian | Foto: tidak perlu batas. Video: batas durasi sesi (usulan 15 menit) |
| Suara | Ada, dengan tombol nyala/mati suara dan kamera |
| Layanan video | Dibangun sendiri (WebRTC peer-to-peer); layanan terkelola jadi cadangan |

### Masih terbuka

1. Server TURN: sewa VPS sendiri (misalnya coturn) atau memakai layanan TURN terkelola? Cek biaya dan syaratnya.
2. Cara membuat dan menambahkan 3 template pertama (lihat usulan struktur template di bagian 7.3 B).
3. Kapan model bisnis dievaluasi ulang, misalnya setelah berapa pengguna aktif atau berapa banyak bandwidth TURN terpakai?

## 18. Arah Desain: Retro Neo-Brutalism

Gaya visual RuangFoto adalah **Retro Neo-Brutalism**: border hitam tebal, bayangan keras tanpa blur, warna cerah di atas latar krem, dengan sentuhan retro khas photobooth (photostrip, stiker, bentuk geometris). Referensinya adalah gambar yang Anda lampirkan. Warna dan ukuran di bawah ini perkiraan dari gambar itu dan bisa disesuaikan. Spesifikasi desain lengkap ada di berkas terpisah design.md; wireframe dan mockup dibuat di tahap berikutnya.

### Prinsip visual

- Border hitam 2–3 px pada semua kartu, tombol, dan input.
- Bayangan keras bergeser sekitar 4 px ke kanan-bawah, tanpa blur.
- Sudut membulat sedang; blok warna besar boleh membulat hanya di satu sudut, seperti panel kuning pada referensi.
- Warna jenuh dengan kontras tinggi; satu warna menonjol di tiap area.
- Tombol terasa fisik: bergeser sedikit saat disentuh, rata dengan bayangan saat ditekan.
- Aksen dekoratif kecil (bintang, kotak, titik, belah ketupat) tersebar di latar.
- Sentuhan retro: bingkai photostrip, badge atau stiker miring, pola halftone atau grid tipis.

### Palet warna (perkiraan)

| Peran | Warna | Perkiraan hex | Dipakai untuk |
| --- | --- | --- | --- |
| Latar | Krem | #FFF3EA | Latar halaman |
| Garis dan teks | Hitam | #1A1A1A | Border, bayangan, teks |
| Utama | Merah koral | #FF5C5C | Tombol utama, CTA |
| Sekunder | Ungu | #A78BFA | Tombol sekunder, label |
| Aksen | Tosca | #36CFC0 | Sukses, status aktif |
| Sorotan | Kuning | #FFE066 | Panel besar, badge |
| Pendukung | Oranye | #F59E5B | Ikon, dekorasi |
| Pendukung | Biru | #3BA7D9 | Tombol unduh, info |
| Latar lembut | Merah muda | #FFC9C4 | Blok latar pendukung |

### Tipografi

Satu keluarga huruf sans-serif geometris yang tegas, seperti Space Grotesk (gratis di Google Fonts). Judul tebal dan besar, angka countdown sangat besar.

### Komponen yang dibutuhkan

- Tombol (utama, sekunder, aksen) dengan ikon.
- Kartu, termasuk kartu template dan kartu dukungan.
- Tab untuk halaman utama: Photobooth, Template, Dukung RuangFoto.
- Input form dan checkbox untuk login.
- Badge (misalnya "Baru", "Gratis") dan pesan sukses.
- Menu dropdown untuk profil dan pengaturan akun.
- Indikator countdown dan status sesi.
- Avatar bulat untuk host dan guest di ruang sesi.

### Penerapan per halaman

| Halaman | Arah desain |
| --- | --- |
| Landing page | Hero besar dengan judul tebal, contoh photostrip miring, kartu "Gratis, dukung seikhlasnya" berwarna mencolok |
| Login | Kartu tunggal di tengah dengan tombol Google dan form email, dikelilingi aksen dekoratif |
| Halaman utama | Tab di atas; area photobooth sebagai panel besar, galeri template berupa kartu, tab dukungan berisi satu kartu ajakan |
| Ruang sesi | Dua jendela video berborder tebal berdampingan (kamera sendiri dan pasangan), countdown angka raksasa, tombol Siap yang menonjol |
| Hasil foto | Photostrip dengan bingkai template, tombol Unduh (host), dan peringatan 1x24 jam sebagai badge mencolok |

### Langkah desain berikutnya

1. Wireframe landing page, login, halaman utama, ruang sesi, dan hasil foto.
2. Mockup berwarna memakai palet di atas.
3. Design tokens (warna, border, bayangan, huruf) dimasukkan ke konfigurasi Tailwind CSS, sejalan dengan stack di bagian 11; referensi Anda juga memakai React dan Tailwind.
