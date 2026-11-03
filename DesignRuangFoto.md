# design.md — RuangFoto (Retro Neo-Brutalism)

Spesifikasi desain untuk aplikasi RuangFoto. Pasangkan dengan `PRD RuangFoto` (kebutuhan fungsional). Jika PRD dan berkas ini berbeda soal perilaku, PRD yang menang; soal tampilan, berkas ini yang menang.

## 0. Cara memakai berkas ini (untuk AI)

- Terapkan token di bagian 2 sebagai satu-satunya sumber warna, huruf, border, bayangan, dan radius. Jangan menambah nilai baru tanpa alasan.
- Bangun komponen di bagian 4 dan 5 sebelum halaman. Halaman di bagian 6 hanya menyusun komponen itu.
- Stack yang disarankan: Next.js (React) + Tailwind CSS + `lucide-react` untuk ikon.
- Sebelum menganggap selesai, cek daftar di bagian 12.

## 1. Arah desain

**Gaya:** Retro Neo-Brutalism, mengikuti gambar referensi: border hitam tebal, bayangan keras tanpa blur, warna jenuh di atas latar krem, tombol yang terasa seperti benda fisik, dan bentuk geometris kecil yang tersebar sebagai aksen.

**Sentuhan retro (khas photobooth):** photostrip, stiker miring, pola titik halftone, dan bingkai foto bergaya film.

**Satu hal yang paling diingat:** photostrip besar di hero landing page dan di layar hasil. Elemen lain dibuat tenang dan disiplin supaya photostrip menjadi pusat perhatian.

**Suasana:** ceria, hangat, dan playful, tetapi tetap mudah dipakai. Kontras tinggi dan teks besar.

## 2. Design tokens

### 2.1 Warna

| Nama | Hex | Peran |
| --- | --- | --- |
| bg | `#FFF3EA` | Latar halaman (krem) |
| ink | `#1A1A1A` | Teks, border, bayangan |
| muted | `#4A4A4A` | Teks sekunder |
| white | `#FFFFFF` | Permukaan kartu dan input |
| coral | `#FF5C5C` | Aksi utama, error, status terputus |
| purple | `#A78BFA` | Aksi sekunder, label |
| teal | `#36CFC0` | Sukses, status terhubung, toggle aktif |
| yellow | `#FFE066` | Sorotan, tab aktif, panel besar |
| orange | `#F59E5B` | Dekorasi, ikon pendukung |
| blue | `#3BA7D9` | Info, tombol unduh |
| pink | `#FFC9C4` | Blok latar lembut, kartu dukungan |

Aturan pemakaian:
- Teks selalu `ink` (atau `muted` untuk keterangan). Jangan memakai teks putih di atas yellow, teal, orange, atau pink.
- Satu warna menonjol per area. Hindari lebih dari tiga warna jenuh dalam satu kelompok komponen.
- Tidak ada gradien.

```css
:root {
  --rf-bg: #FFF3EA;
  --rf-ink: #1A1A1A;
  --rf-muted: #4A4A4A;
  --rf-white: #FFFFFF;
  --rf-coral: #FF5C5C;
  --rf-purple: #A78BFA;
  --rf-teal: #36CFC0;
  --rf-yellow: #FFE066;
  --rf-orange: #F59E5B;
  --rf-blue: #3BA7D9;
  --rf-pink: #FFC9C4;

  --rf-border: 3px solid var(--rf-ink);
  --rf-border-thin: 2px solid var(--rf-ink);
  --rf-shadow-sm: 3px 3px 0 0 var(--rf-ink);
  --rf-shadow: 4px 4px 0 0 var(--rf-ink);
  --rf-shadow-lg: 6px 6px 0 0 var(--rf-ink);

  --rf-radius-sm: 8px;
  --rf-radius: 12px;
  --rf-radius-lg: 20px;
  --rf-radius-panel: 40px;
}
```

### 2.2 Tipografi

- Keluarga huruf: **Space Grotesk** (Google Fonts), bobot 400, 500, 700. Cadangan: `system-ui, sans-serif`. Satu keluarga untuk semuanya.
- Judul bobot 700 dengan `letter-spacing: -0.02em`. Isi teks bobot 400 atau 500.
- Gaya kalimat biasa (sentence case). Jangan memakai huruf kapital semua untuk label.
- Lebar baris teks maksimal 65 karakter.

| Peran | Mobile | Desktop | Bobot |
| --- | --- | --- | --- |
| Display (hero) | 40/44 | 64/66 | 700 |
| H1 | 32/36 | 44/48 | 700 |
| H2 | 24/28 | 32/36 | 700 |
| H3 | 20/24 | 24/28 | 700 |
| Isi | 16/24 | 16/24 | 400 |
| Kecil | 14/20 | 14/20 | 500 |
| Countdown | 120/120 | 160/160 | 700 |

### 2.3 Bentuk dan jarak

- **Border:** 3px `ink` untuk kartu, tombol, input, dan tile video. 2px untuk elemen kecil (badge, chip).
- **Bayangan:** hanya bayangan keras, bergeser ke kanan-bawah, tanpa blur: kecil 3px, normal 4px, besar 6px. Warna `ink`.
- **Radius:** 8 (kecil), 12 (tombol, input), 20 (kartu, tile video), 999 (pil), dan 40 untuk satu sudut panel besar. Gunakan radius sesuai hirarki, jangan satu nilai untuk semuanya.
- **Panel dengan satu sudut besar:** blok warna besar (yellow, pink) boleh membulat 40px hanya di satu sudut, seperti panel kuning pada referensi.
- **Spasi:** skala 4, 8, 12, 16, 24, 32, 48, 64. Padding kartu 20 (mobile) dan 24 (desktop). Jarak antar bagian halaman 64 (mobile) dan 96 (desktop).
- **Lebar konten:** maksimal 1120px, dipusatkan.

## 3. Pengaturan Tailwind

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        rf: {
          bg: '#FFF3EA', ink: '#1A1A1A', muted: '#4A4A4A',
          coral: '#FF5C5C', purple: '#A78BFA', teal: '#36CFC0',
          yellow: '#FFE066', orange: '#F59E5B', blue: '#3BA7D9', pink: '#FFC9C4',
        },
      },
      fontFamily: { sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'] },
      borderWidth: { 3: '3px' },
      boxShadow: {
        'hard-sm': '3px 3px 0 0 #1A1A1A',
        hard: '4px 4px 0 0 #1A1A1A',
        'hard-lg': '6px 6px 0 0 #1A1A1A',
      },
      borderRadius: { panel: '40px' },
    },
  },
};
```

## 4. Komponen dasar

Semua komponen memakai ikon `lucide-react` dengan `strokeWidth={2.5}`, ukuran 20 (dalam tombol) atau 24. Jangan memakai emoji sebagai ikon.

### 4.1 Tombol

```css
.rf-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 48px; padding: 0 20px;
  font: 700 16px/1 'Space Grotesk', system-ui, sans-serif; color: var(--rf-ink);
  background: var(--rf-white);
  border: var(--rf-border); border-radius: var(--rf-radius);
  box-shadow: var(--rf-shadow);
  transition: transform 80ms, box-shadow 80ms;
  cursor: pointer;
}
.rf-btn:hover { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 0 var(--rf-ink); }
.rf-btn:active { transform: translate(4px, 4px); box-shadow: 0 0 0 0 var(--rf-ink); }
.rf-btn:focus-visible { outline: 3px solid var(--rf-ink); outline-offset: 3px; }
.rf-btn:disabled { opacity: .5; box-shadow: none; cursor: not-allowed; transform: none; }
.rf-btn--primary { background: var(--rf-coral); }
.rf-btn--secondary { background: var(--rf-purple); }
.rf-btn--accent { background: var(--rf-teal); }
.rf-btn--highlight { background: var(--rf-yellow); }
.rf-btn--info { background: var(--rf-blue); }
```

- Satu tombol utama (coral) per layar.
- Tombol ikon saja: 48×48 (minimal 44×44), wajib punya `aria-label`.
- Tombol memuat: teks diganti dengan "Memproses…" dan tombol dinonaktifkan; jangan memakai spinner berputar sebagai satu-satunya penanda.

### 4.2 Kartu

- Latar `white`, border 3px, radius 20, bayangan besar 6px. Varian berwarna memakai `yellow`, `pink`, atau `teal` sebagai latar.
- Kartu yang bisa diklik naik 1px saat hover dan turun saat ditekan, sama seperti tombol.
- Judul kartu H3. Satu kartu satu tujuan.

### 4.3 Tab (navigasi halaman utama)

- Kelompok tab dalam satu kotak: border 3px, radius 12, bayangan normal. Sel dipisah garis 3px `ink`.
- Tab aktif berlatar `yellow`, tab tidak aktif `white`. Tinggi 48.
- Tab: **Photobooth**, **Template**, **Dukung RuangFoto**. Di mobile boleh bergulir ke samping.
- Gunakan `role="tablist"`, `role="tab"`, `aria-selected`, dan navigasi panah.

### 4.4 Input teks

- Latar `white`, border 3px, radius 12, tinggi 48, padding 0 16px.
- Label di atas input, 14/20 bobot 700. Teks bantuan atau error di bawah, 14/20.
- Fokus: bayangan keras 4px muncul dan outline `ink` 3px.
- Error: border tetap `ink`, pesan berwarna `ink` di atas blok `coral` kecil dengan ikon. Jangan hanya mengandalkan warna merah.

### 4.5 Checkbox dan toggle

- Checkbox 24×24, border 3px, radius 6. Terpilih: latar `coral` dengan centang `ink`.
- Toggle 52×28, border 3px, pil. Aktif: latar `teal`, kenop `ink` di kanan. Nonaktif: latar `white`, kenop di kiri. Selalu ada teks status di sampingnya ("Aktif" atau "Nonaktif").

### 4.6 Badge dan stiker

- Badge: pil, border 2px, padding 4px 12px, 14/20 bobot 700. Warna: `yellow` untuk "Baru", `teal` untuk "Gratis", `purple` untuk label lain.
- Stiker (dekoratif, di landing dan hasil): badge atau lingkaran berputar -3° sampai 3°. Maksimal 3 stiker berputar per layar, dan tidak boleh ada kontrol yang berputar.

### 4.7 Menu dropdown

- Gaya kartu kecil: border 3px, radius 12, bayangan normal. Item tinggi 44, pemisah garis 2px `ink`, hover `yellow`.
- Dipakai untuk menu profil (Profil, Keluar).

### 4.8 Indikator progres

- Tinggi 20, border 3px, pil. Isi berwarna (`coral`, `purple`, atau `teal`) dengan garis `ink` pemisah di ujung isi.
- Dipakai untuk unggah foto dan hitung mundur penghapusan.

### 4.9 Avatar

- Lingkaran 40px, border 3px, latar warna palet, inisial `ink` bobot 700. Avatar bertumpuk saling menimpa -8px, seperti pada referensi. Dipakai untuk host dan guest di ruang sesi.

### 4.10 Notifikasi (toast)

- Kotak `teal` untuk sukses, `yellow` untuk info, `coral` untuk error. Border 3px, radius 12, bayangan normal, ikon di kiri, teks pendek.
- Muncul di atas (mobile) atau kanan-bawah (desktop), hilang setelah 4 detik, dan bisa ditutup. Gunakan `role="status"`.

## 5. Komponen khusus RuangFoto

### 5.1 Tile video

- Rasio 4:3 (desktop) dan 3:4 (mobile). Border 4px, radius 20, bayangan besar.
- Label nama di kiri-bawah: chip `white`, border 2px.
- Status koneksi di kanan-atas: chip dengan ikon dan teks. **Terhubung** (`teal`), **Menyambung…** (`yellow`), **Terputus** (`coral`).
- Kamera mati: tampilkan avatar besar di atas blok warna palet dengan teks "Kamera dimatikan".
- Suara mati: ikon mikrofon dicoret berlatar `coral` di kiri-atas.
- Tile pasangan menunggu: latar `pink` dengan pola halftone dan teks "Menunggu pasanganmu masuk…".
- Tile video tidak pernah berputar atau diberi efek.

### 5.2 Bilah kontrol sesi

- Berisi, dari kiri ke kanan: tombol mikrofon, tombol kamera, tombol **Siap** (lebar, utama), tombol **Keluar** (`coral`, hanya ikon + label).
- Tombol mikrofon dan kamera 56×56, berbentuk bulat, border 3px, bayangan normal.
  - Aktif: latar `white`, ikon mikrofon atau kamera.
  - Mati: latar `coral`, ikon dicoret, dan label kecil di bawah ("Suara mati", "Kamera mati"). Status tidak boleh hanya berupa warna.
- Di mobile, bilah ditempel di bawah layar dengan padding `env(safe-area-inset-bottom)`.

### 5.3 Countdown

- Angka 3, 2, 1 ditampilkan di tengah masing-masing tile (atau di tengah layar di mobile) di dalam lingkaran `yellow` berborder 4px dan bayangan besar.
- Animasi: setiap angka muncul dengan skala 0,8 ke 1 selama 300 ms. Setelah nol, tampilkan "Cekrek!" selama 600 ms dan kilatan putih 120 ms di atas tile.
- Gunakan `aria-live="assertive"` untuk angka dan sertakan teks "Foto diambil".
- Dengan `prefers-reduced-motion`: tanpa skala dan tanpa kilatan, hanya pergantian angka.

### 5.4 Status pose

- Baris indikator di atas tile: satu lingkaran per pose (misalnya 4), isinya kosong (belum), `yellow` (sedang), `teal` dengan centang (selesai). Teks di sebelahnya: "Pose 2 dari 4".

### 5.5 Kotak link undangan

- Kartu `white` berisi input baca-saja dan tombol **Salin link** (`highlight`). Setelah disalin: toast "Link tersalin" dan teks tombol berubah menjadi "Tersalin" selama 2 detik.

### 5.6 Photostrip

- Strip vertikal berlatar `white`, border 3px, bayangan besar. Setiap bingkai foto berborder 3px dengan radius 8. Bingkai dari template (PNG transparan) ditumpuk di atas foto.
- Hiasan retro pada strip: bintang kecil dan teks "RuangFoto" di bagian bawah.
- Di hero landing, strip boleh berputar -4° dan sedikit menimpa tile video. Di layar hasil, strip lurus.

### 5.7 Kartu template

- Pratinjau strip kecil di atas, nama template, badge "Gratis", dan tombol **Pakai template**.
- Terpilih: latar kartu `yellow`, centang `teal` di sudut kanan-atas, dan teks tombol menjadi "Dipakai".

### 5.8 Kartu dukungan

- Panel `pink` dengan sudut 40px di satu sisi, ikon hati, dan teks:
  "RuangFoto gratis. Kalau suka, dukung seikhlasnya untuk biaya server. Dukungan tidak membuka fitur apa pun."
- Tombol **Dukung di Saweria** (`primary`) membuka tab baru.

### 5.9 Peringatan penghapusan

- Banner `yellow`, border 3px, di atas layar hasil: "Foto terhapus dalam 23:41:10. Unduh sekarang." dengan indikator progres di bawahnya.
- Bagi guest, teks diganti: "Hanya host yang bisa mengunduh hasil ini."

## 6. Halaman dan tata letak

Semua halaman mobile-first. Wireframe di bawah adalah tata letak desktop.

### 6.1 Landing page

```
┌────────────────────────────────────────────────────────┐
│ RuangFoto                                      [Masuk]  │
├────────────────────────────────────────────────────────┤
│ Foto bareng,                         ┌──── photostrip ─┐│
│ walau beda kota.                     │  (miring -4°)   ││
│ Photobooth online gratis untuk       │  + 2 tile video ││
│ kamu dan pasanganmu.                 └─────────────────┘│
│ [Mulai foto]  [Lihat cara kerja]                        │
├────────────────────────────────────────────────────────┤
│ Cara kerja: 3 kartu berurutan (buat sesi, undang, foto) │
├────────────────────────────────────────────────────────┤
│ Yang kamu dapat: Foto jarak jauh | Template | Gratis    │
├────────────────────────────────────────────────────────┤
│ Contoh hasil: 3 photostrip                              │
├────────────────────────────────────────────────────────┤
│ Panel pink: "Gratis, dukung seikhlasnya" [Dukung]       │
├────────────────────────────────────────────────────────┤
│ FAQ (akordeon)                                          │
│ Footer: kontak · privasi · syarat                       │
└────────────────────────────────────────────────────────┘
```

- Rata kiri untuk teks, hero dua kolom. Mobile: teks di atas, photostrip di bawah.
- Penomoran hanya di "Cara kerja" karena itu memang urutan langkah.
- Satu panel `yellow` besar (sudut 40px) sebagai latar hero. Bagian lain berlatar `bg`.
- Tidak ada bagian harga. Gantinya adalah panel dukungan (kartu dukungan 5.8).

### 6.2 Halaman login

```
┌─────────────────────────────────────┐
│  ◆        ★                    ■    │
│        ┌─────────────────────┐      │
│        │ Masuk ke RuangFoto   │      │
│        │ [ Masuk | Daftar ]  │      │
│        │ [G Masuk dengan Google]    │
│        │ ───────── atau ──────      │
│        │ Email   [___________]      │
│        │ Kata sandi [_______]       │
│        │ [Masuk]                    │
│        │ Lupa kata sandi?           │
│        └─────────────────────┘      │
│  ■            ◆           ★         │
└─────────────────────────────────────┘
```

- Satu kartu di tengah, lebar maksimal 440px. Tab "Masuk" dan "Daftar" memakai gaya tab (4.3).
- Setelah daftar: layar "Cek email kamu untuk verifikasi" dengan tombol **Kirim ulang email**.
- Tombol Google berlatar `white`, tombol masuk `primary`.

### 6.3 Halaman utama (`/app`)

```
┌────────────────────────────────────────────────────────┐
│ RuangFoto   [Photobooth | Template | Dukung RuangFoto]  (AB)│
├────────────────────────────────────────────────────────┤
│ Tab Photobooth:                                         │
│ ┌──────────────────────────┐ ┌───────────────────────┐ │
│ │ Mulai sesi baru          │ │ Template dipakai      │ │
│ │ Template: [Nama] [Ganti] │ │ [strip kecil]         │ │
│ │ [Buat sesi]              │ └───────────────────────┘ │
│ └──────────────────────────┘                           │
│ Tab Template: grid kartu template (3 saat rilis)        │
│ Tab Dukung RuangFoto: kartu dukungan                     │
└────────────────────────────────────────────────────────┘
```

- Bilah atas: logo, tab, dan avatar dengan dropdown (Profil, Keluar).
- Keadaan kosong: "Belum ada sesi. Buat sesi lalu kirim linknya ke pasanganmu."

### 6.4 Ruang sesi (`/app/session/[kode]`)

Desktop:
```
┌────────────────────────────────────────────────────────┐
│ Pose 2 dari 4  ● ● ○ ○          [Terhubung]   (A)(B)  │
├───────────────────────────┬────────────────────────────┤
│  tile video: kamu         │  tile video: pasangan      │
│                           │                            │
├───────────────────────────┴────────────────────────────┤
│ [Mik] [Kamera]        [   Siap   ]          [Keluar]   │
└────────────────────────────────────────────────────────┘
```

Mobile:
```
┌──────────────────────┐
│ Pose 2 dari 4  ●●○○  │
│ ┌──────────────────┐ │
│ │ tile pasangan    │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ tile kamu        │ │
│ └──────────────────┘ │
│ [Mik][Kam][ Siap ][X]│  (menempel di bawah)
└──────────────────────┘
```

- Saat menunggu guest: tampilkan kotak link undangan (5.5) di tengah dan tile pasangan dalam keadaan menunggu.
- Latar halaman `bg` tanpa dekorasi berlebih supaya perhatian ada di tile video.
- Saat countdown berjalan, tombol Siap dan kontrol lain dinonaktifkan kecuali mikrofon.

### 6.5 Layar hasil (`/app/result/[id]`)

```
┌────────────────────────────────────────────────────────┐
│ [Banner kuning: Foto terhapus dalam 23:41:10]          │
├────────────────────────┬───────────────────────────────┤
│   photostrip (lurus)   │ Hasilnya sudah jadi!          │
│                        │ [Unduh hasil]   (hanya host)  │
│                        │ [Foto ulang]                  │
│                        │ Kartu dukungan (kecil)        │
└────────────────────────┴───────────────────────────────┘
```

- Mobile: strip di atas, aksi di bawah.
- Guest melihat hasil tanpa tombol Unduh dan melihat teks penjelasan.
- Selama foto digabung: indikator progres dan teks "Menggabungkan foto…".

## 7. Dekorasi retro

- **Bentuk geometris:** bintang, kotak, titik, dan belah ketupat kecil (12–24px) berwarna palet dengan border 2px `ink`, tersebar di latar landing, login, dan halaman utama. Maksimal 8 per layar, jangan menutupi teks, wajib `aria-hidden="true"` dan `pointer-events: none`.
- **Pola halftone:** titik `ink` dengan opasitas 12% pada satu panel per halaman (misalnya tile video menunggu atau latar hero).
- **Panel sudut besar:** satu panel `yellow` atau `pink` per halaman dengan satu sudut 40px, seperti pada referensi.
- **Tidak ada** gradien, tekstur foto, kaca buram, atau bayangan lembut.

## 8. Gerak

- Gerak hanya bila menjawab tindakan pengguna: tekan tombol, hitungan mundur, notifikasi muncul, tab berganti.
- Satu gerak masuk saja pada landing page: photostrip hero jatuh dan berputar ke -4° selama 600 ms, sekali saat halaman dimuat.
- Tidak ada animasi muncul pada setiap bagian, dan tidak ada efek hover pada setiap kartu kecuali kartu yang bisa diklik.
- Hormati `prefers-reduced-motion: reduce`: hapus semua transformasi dan animasi, sisakan perubahan warna instan.

## 9. Responsif dan aksesibilitas

- Titik henti: 640px, 1024px. Mulai dari mobile 360px.
- Target sentuh minimal 44×44px. Teks isi minimal 16px.
- Fokus keyboard selalu terlihat: outline 3px `ink` dengan offset 3px.
- Kontras: `ink` pada semua warna palet memenuhi kontras teks. Jangan menempatkan `muted` di atas `coral` atau `purple`.
- Status tidak boleh hanya berupa warna; selalu ikon dan teks.
- Semua tombol ikon punya `aria-label`. Countdown dan status koneksi memakai `aria-live`.
- Halaman bisa dipakai tanpa mouse: urutan tab logis, tab navigasi mendukung panah.

## 10. Suara tulisan (copy)

- Bahasa Indonesia, nada ramah dan santai dengan "kamu". Kalimat biasa, kata kerja aktif, tanpa basa-basi.
- Satu aksi punya satu nama di seluruh alur. Contoh: tombol "Buat sesi" menghasilkan pesan "Sesi dibuat".
- Teks tombol utama: **Mulai foto**, **Masuk dengan Google**, **Masuk**, **Daftar**, **Buat sesi**, **Salin link**, **Siap**, **Foto ulang**, **Unduh hasil**, **Dukung di Saweria**.
- Jangan menambahkan tanda panah (→) pada teks tombol.
- Error menjelaskan masalah dan cara memperbaiki, tanpa minta maaf berlebihan. Contoh: "Kamera belum diizinkan. Buka pengaturan browser, izinkan kamera, lalu muat ulang halaman."
- Keadaan menunggu: "Menunggu pasanganmu masuk…". Keadaan kosong mengajak bertindak.
- Pesan privasi singkat di ruang sesi: "Video tidak direkam. Hanya foto yang disimpan, dan terhapus dalam 1x24 jam."
- Teks dukungan selalu menyebut bahwa dukungan tidak membuka fitur.

## 11. Larangan

- Bayangan lembut atau berblur, gradien, efek kaca, dan border tipis kelabu.
- Satu nilai radius untuk semua elemen.
- Huruf kapital semua untuk label, dan menandai satu kata dalam judul dengan warna atau miring.
- Penomoran dekoratif (01, 02, 03) selain pada langkah yang memang berurutan.
- Kontrol, tile video, atau teks isi yang berputar.
- Lebih dari satu tombol utama (coral) per layar.
- Memakai teks putih di atas warna palet terang.
- Menampilkan harga, paket, atau label "Premium": RuangFoto gratis.

## 12. Daftar periksa sebelum selesai

- [ ] Semua warna, border, bayangan, dan radius berasal dari token bagian 2.
- [ ] Tombol: hover naik, aktif turun ke bayangan nol, fokus terlihat, nonaktif jelas.
- [ ] Satu tombol utama per layar.
- [ ] Mikrofon dan kamera punya status ikon + teks.
- [ ] Countdown tersinkron di layar dan terbaca oleh pembaca layar.
- [ ] Layar hasil menampilkan peringatan penghapusan 1x24 jam.
- [ ] Guest tidak melihat tombol Unduh.
- [ ] Tidak ada tampilan harga, paket, atau fitur yang terkunci.
- [ ] Mobile 360px: tidak ada gulir ke samping; bilah kontrol aman di iPhone.
- [ ] `prefers-reduced-motion` dihormati.
- [ ] Dekorasi retro tidak lebih dari 8 per layar dan tidak menutupi konten.
