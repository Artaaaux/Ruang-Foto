---
target: src/app/page.tsx
total_score: 23
max_score: 36
na_heuristics: 7
p0_count: 1
p1_count: 3
target_identity: "file:E:\\File\\Project\\RuangFoto\\src\\app\\page.tsx"
target_fingerprint: "sha256:1db0efb08cd0275c1e8387dfc8032583aed6bb1b82e5216c1acf28d9780e4ecd"
target_path: "E:\\File\\Project\\RuangFoto\\src\\app\\page.tsx"
timestamp: 2026-11-10T14-10-43Z
slug: src-app-page-tsx
---
### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Halaman statis landing page cukup jelas; hero mockup mensimulasikan status "Live" dan "Siap!" dengan baik. |
| 2 | Match System / Real World | 3 | Metafora photobox dan bahasa santai sangat cocok, namun ada kebocoran istilah teknis bahasa Inggris ("CAM 01", "HD 1080P", "SYNCED", "Live") dan jargon "Host/Guest" pada badge langkah. |
| 3 | User Control and Freedom | 3 | Navigasi anchor dan FAQ accordion bekerja lancar, namun pengunjung tidak diberi ruang mencoba/melihat interaksi sebelum dipaksa registrasi. |
| 4 | Consistency and Standards | 2 | Header "Masuk" dan tombol hero "Mulai foto bareng" mengarah ke rute yang sama (`/login`) dengan penamaan berbeda; warna coral terpakai untuk indikator live padahal aturan desain mencadangkannya untuk error/putus. |
| 5 | Error Prevention | 2 | Stiker "Gratis tanpa syarat" bertentangan dengan keharusan verifikasi email & login bagi kedua belah pihak; belum ada edukasi izin kamera sebelum masuk room. |
| 6 | Recognition Rather Than Recall | 3 | Navigasi sticky ada di atas namun tidak membawa CTA konversi ("Mulai foto") saat pengguna melakukan scroll. |
| 7 | Flexibility and Efficiency | n/a | Mode Persuade satu arah; tombol jalan pintas "Halaman utama" bagi sesi aktif sudah ada. |
| 8 | Aesthetic and Minimalist Design | 2 | Informasi "gratis / privat / hapus 24 jam" diulang hingga 7 kali di satu halaman sementara value emosional LDR belum dieksploitasi maksimal; paragraf hero terlalu padat di mobile. |
| 9 | Error Recovery | 2 | Belum ada deteksi in-app browser (Instagram/TikTok/LINE webview) yang memblokir Google OAuth dan permission kamera WebRTC. |
| 10 | Help and Documentation | 3 | FAQ accordion menjawab banyak keraguan teknis dan privasi dengan bahasa santai. |
| **Total** | | **23/36** | **Acceptable (64%)** |

### Design Specificity Verdict

**LLM Assessment:**
Hero section tampil otentik dan sangat berkarakter (*high specificity*): panel kuning `#FFE066` bersudut asimetris `40px` dengan tekstur halftone, dua tile video dengan bracket sudut viewfinder, serta photostrip miring `-4°` yang membaca aset asli template. Namun, bagian di bawah hero mengalami de-eskalasi menjadi struktur SaaS generik yang sekadar diwarnai neo-brutalism: pola 3 kartu horizontal → bento grid fitur → 3 strip foto → panel donasi → FAQ → footer. Pola heading `h2.rf-h1 + p.rf-muted + mb-10` berulang 4 kali berturut-turut tanpa variasi ritme tata letak.

**Deterministic Scan:**
Pemindaian mekanis `impeccable detect` melaporkan 0 kesalahan fatal/slop (tidak ada gradien teks, garis samping buatan AI, atau font generik). Terdapat 30 catatan *advisory token drift* (`design-system-font-size`), terutama ukuran teks di bawah batas minimal 14px pada mockup hero (8px metadata, 9px pill status, 10px kota) serta teks 8px berkontras rendah (sekitar 3.1:1).

**Visual Overlays:**
Visual overlay di browser dilewati karena mode otomatis browser headless tidak tersedia di sesi ini.

### Overall Impression
Secara visual, identitas **Retro Neo-Brutalism** berhasil dieksekusi dengan garis tinta tebal `3px solid #1A1A1A` dan palet kertas krem hangat yang sangat segar dibanding aplikasi video call korporat. Namun dari kacamata **Harvard Marketing & Frontend Engineering**, halaman ini saat ini masih menjual "fitur teknis & privasi" secara berulang-ulang, bukan menjual "solusi rindu & momen kebersamaan". Titik konversi tertinggi justru terancam gagal akibat friksi login wall dan in-app browser trap.

### What's Working
1. **Daya Tarik Hero & Kejujuran Aset:** Komposisi desktop hero sangat kuat merepresentasikan produk. Penggunaan template nyata dengan kemiringan `-4°` serta detail kota "Jakarta" dan "Bandung" langsung menyentuh konteks LDR.
2. **Kesesuaian Bahasa Penolakan Keberatan (Objection Handling):** Poin "Bukan screenshot buram. Ini photobox sungguhan." adalah copy terkuat di seluruh halaman, membedakan produk langsung dari kebiasaan kompromi pasangan LDR.
3. **Disiplin Etika Model Gratis:** Komitmen tanpa paywall dan transparansi donasi sukarela Saweria dibangun dengan integritas tinggi tanpa dark pattern.

### Priority Issues

- **[P0] In-App Browser Trap (Instagram & TikTok Webview)**
  - *Why it matters:* 80%+ audiens muda LDR mengklik link dari Instagram Bio, TikTok, atau chat WhatsApp. Webview in-app browser memblokir Google OAuth (`disallowed_useragent`) dan sering mengalami crash izin `getUserMedia` kamera. Pengunjung terpental sebelum sempat mencoba.
  - *Fix:* Tambahkan deteksi User-Agent di frontend. Tampilkan banner retro kuning tegas di bawah header: *"Kamu membuka dari aplikasi lain. Buka di Chrome/Safari agar kamera & login Google lancar"* lengkap dengan tombol 1-klik "Salin Link".
  - *Suggested command:* `$impeccable harden`

- **[P1] Login Wall & Paradoks "Gratis Tanpa Syarat"**
  - *Why it matters:* Stiker menjanjikan "Gratis tanpa syarat", tetapi klik pertama langsung membentur dinding form login + verifikasi email. Ini menciptakan *cognitive dissonance* dan *drop-off* masif. Pasangan yang diundang (Guest) juga belum dipersiapkan bahwa mereka harus login.
  - *Fix:* Ganti teks stiker menjadi *"100% Gratis, Tanpa Paywall"*. Tambahkan mikro-copy transparan di bawah CTA hero: *"Masuk instan 1-klik dengan Google. Pasanganmu masuk lewat link undangan"*. Sebagai tuas konversi utama, sediakan tombol sekunder *"Coba demo sendiri"* yang memanfaatkan fitur `Simulasi Pasangan` tanpa wajib login terlebih dahulu.
  - *Suggested command:* `$impeccable clarify`

- **[P1] Mockup Hero Tidak Memperlihatkan "The Magic Moment" & Terkubur di Mobile**
  - *Why it matters:* Di layar smartphone (360–390px), mockup photostrip baru terlihat di kedalaman scroll ~720px karena tertutup teks pengantar yang panjang. Selain itu, tile video hanya menampilkan avatar kartun statis tanpa memperlihatkan sensasi hitungan mundur 3-2-1 yang merupakan inti keseruan photobooth.
  - *Fix:* Susun ulang tata letak mobile agar tile video dan countdown tampil di atas lipatan layar (*above the fold*). Hadirkan lingkaran countdown kuning "2" yang berdenyut di antara kedua video tile, dan gunakan setidaknya 1 contoh foto manusia asli (dengan izin) agar klaim "HD jernih" terbukti nyata.
  - *Suggested command:* `$impeccable layout`

- **[P2] Ritme CTA yang Hilang di Sepanjang Scroll & Anti-Klimaks Halaman**
  - *Why it matters:* Pengunjung yang membaca penjelasan fitur, melihat galeri, dan membaca FAQ tidak menemukan tombol aksi di bagian bawah halaman. Halaman berakhir dengan penjelasan penghapusan foto dan footer dingin tanpa penutupan emosional (*peak-end rule violation*).
  - *Fix:* Geser kartu donasi Saweria ke area dekat footer. Tambahkan *Closing Hero Banner* setelah FAQ berisikan hook emosional penutup: *"Jangan tunggu akhir pekan buat bikin kenangan"* dengan tombol utama "Mulai foto bareng". Ubah tombol sticky header menjadi tombol aksi dinamis saat layar melewati hero.
  - *Suggested command:* `$impeccable layout`

- **[P3] Inkonsistensi Tipografi & Kebocoran Token Desain**
  - *Why it matters:* Terdapat 30 advisory ukuran font off-spec (termasuk teks 8px-10px pada mockup kamera) dan pelanggaran aturan sentence case pada badge bergaya retro ("CAM 01", "HD 1080P", "SYNCED").
  - *Fix:* Rapikan ukuran token font agar konsisten dengan `DESIGN.md` dan pastikan seluruh teks dekoratif terbaca atau diberi atribut `aria-hidden="true"`.
  - *Suggested command:* `$impeccable typeset`

### Persona Red Flags
- **Jordan (First-Timer):** Baru mengetahui bahwa ia wajib mendaftar akun di langkah Cara Kerja ke-1; bingung dengan istilah "Host & Guest"; meragukan keaslian klaim "ribuan pejuang LDR" karena seluruh visual didominasi kartun Open Peeps.
- **Casey (Mobile User 360px):** Mengalami scroll lelah (*visual fatigue*) karena hero setinggi 1300px; CTA "Lihat cara kerja" terpotong baris; mockup visual berada di luar layar pertama.
- **Dinda (Mahasiswi LDR 21 tahun via Instagram):** Ingin tahu apakah hasilnya estetik untuk Instagram Story, namun galeri hanya menampilkan format vertikal desktop tanpa mockup nyata di layar HP atau casing transparan; terancam gagal login jika membuka lewat in-app browser.
- **Raka (Pasangan yang Diundang / Guest):** Menerima tautan WhatsApp tanpa konteks; halaman sama sekali tidak menyapa atau menenangkan dirinya bahwa proses bergabung hanya butuh 30 detik tanpa instal aplikasi.

### Minor Observations & Engineering Notes
- Accordion FAQ memiliki `aria-expanded` tetapi belum dilengkapi pasangan atribut `id` dan `aria-controls` serta tag heading semantik (`h3`), sehingga navigasi screen reader terlewat.
- Komponen photostrip di hero dan galeri mengumumkan alt text kartun secara berulang (~30 pengumuman suara). Mockup dekoratif sebaiknya diberi `aria-hidden="true"`.
- Elemen dekorasi retro (`RetroStar`, `RetroDiamond`) menggunakan posisi absolut piksel (`top-[620px]`, `top-[980px]`) yang rentan menimpa kartu konten pada resolusi tablet/laptop tanggung (1024–1170px). Sebaiknya diikat relatif ke kontainer section.
- Dokumentasi `PRODUCT.md` menyebut 3 template awal, sementara kode basis sudah memuat 16 template aktif.

### Questions to Consider
1. Mengapa pengunjung baru diwajibkan mendaftar akun terlebih dahulu sebelum merasakan sensasi hitungan mundur 3-2-1 di fitur Simulasi Pasangan?
2. Apakah landing page ini seharusnya memiliki banner atau alur khusus untuk menyambut "Guest" yang membuka tautan dari pasangan mereka?
3. Seberapa besar lonjakan konversi jika kita mengganti salah satu strip kartun dengan contoh foto pasangan nyata yang diselipkan di casing HP transparan?
