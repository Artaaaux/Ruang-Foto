---
name: RuangFoto
description: Photobooth jarak jauh gratis bergaya Retro Neo-Brutalism
colors:
  bg: "#FFF3EA"
  ink: "#1A1A1A"
  muted: "#4A4A4A"
  white: "#FFFFFF"
  coral: "#FF5C5C"
  purple: "#A78BFA"
  teal: "#36CFC0"
  yellow: "#FFE066"
  orange: "#F59E5B"
  blue: "#3BA7D9"
  pink: "#FFC9C4"
typography:
  display:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "64px"
    fontWeight: 700
    lineHeight: 1.03
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: 1.09
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.16
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.43
rounded:
  sm: "8px"
  md: "12px"
  lg: "20px"
  panel: "40px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.purple}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-highlight:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  card-surface:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: RuangFoto

## Overview

**Creative North Star: "The Tactile Retro Photobooth"**

RuangFoto membawa kehangatan bilik photobooth analog ke layar web modern melalui bahasa visual **Retro Neo-Brutalism**. Setiap komponen memiliki garis tepi tinta hitam tebal (`3px solid #1A1A1A`), bayangan keras tanpa blur yang bergeser tegas ke kanan-bawah, serta warna-warna jenuh di atas latar krem hangat (`#FFF3EA`). Tombol dan kartu terasa seperti tombol mesin fisik yang membal saat disentuh dan merata dengan bayangannya saat ditekan.

Sentuhan retro khas photobooth diwujudkan lewat komponen photostrip berbingkai tebal, stiker pil yang sedikit miring (`-3°` hingga `3°`), dan pola titik halftone halus (`12%` opasitas) pada satu panel sorotan per halaman. Ketika pengguna masuk ke ruang sesi, ornamen latar ditenangkan sepenuhnya agar fokus tertuju pada wajah pasangan di jendela video dan angka hitungan mundur raksasa.

**Key Characteristics:**
- Garis tinta hitam tegas (`3px` pada komponen utama, `4px` pada tile video, `2px` pada badge) dengan bayangan keras tanpa blur (`3px`, `4px`, `6px`).
- Satu keluarga tipografi geometris (**Space Grotesk**) dalam sentence case tanpa label huruf kapital semua.
- Kontras teks disiplin menggunakan warna `ink` (`#1A1A1A`) di atas seluruh warna palet tanpa teks putih pada permukaan cerah.
- Satu tombol utama (`coral` `#FF5C5C`) per layar untuk menjaga hirarki tindakan yang jelas.

## Colors

Palet warna jenuh berkarakter ceria dan hangat di atas permukaan kertas krem retro, tanpa gradien sama sekali.

### Primary
- **Coral Shutter** (`#FF5C5C`): Dipakai khusus untuk satu tombol aksi utama (CTA) per layar, penanda error, serta indikator mikrofon/kamera mati atau status terputus.

### Secondary
- **Lavender Tape** (`#A78BFA`): Dipakai untuk tombol aksi sekunder, label kategori template, dan avatar pasangan.
- **Mint Connected** (`#36CFC0`): Dipakai untuk status terhubung, lencana "Gratis", toggle aktif, dan notifikasi berhasil.

### Tertiary
- **Sunbeam Booth** (`#FFE066`): Dipakai untuk panel hero besar bersudut `40px`, tab aktif, lingkaran hitungan mundur, dan peringatan batas waktu 1x24 jam.
- **Blush Support** (`#FFC9C4`): Dipakai untuk panel kartu dukungan Saweria dan latar tile video saat menunggu pasangan bergabung.
- **Tangerine Spark** (`#F59E5B`): Dipakai untuk bentuk dekoratif geometris kecil.
- **Sky Info** (`#3BA7D9`): Dipakai untuk elemen informasi pendukung.

### Neutral
- **Warm Cream Ground** (`#FFF3EA`): Latar utama seluruh halaman.
- **Photobooth Ink** (`#1A1A1A`): Warna tunggal untuk seluruh teks utama, border, dan bayangan keras.
- **Muted Graphite** (`#4A4A4A`): Teks keterangan sekunder di atas permukaan putih atau krem.
- **Paper White** (`#FFFFFF`): Permukaan dasar kartu, input teks, dan bingkai photostrip klasik.

### Named Rules
**The Ink-On-Everything Rule.** Teks selalu menggunakan `ink` (`#1A1A1A`) atau `muted` (`#4A4A4A` hanya di atas putih/krem). Jangan pernah menempatkan teks putih di atas warna kuning, tosca, oranye, atau merah muda.

**The Single Coral Action Rule.** Hanya boleh ada satu tombol utama berlatar `coral` (`#FF5C5C`) pada setiap layar agar pengguna langsung mengenali tindakan utama.

## Typography

**Display Font:** Space Grotesk (dengan cadangan `system-ui, sans-serif`)
**Body Font:** Space Grotesk (dengan cadangan `system-ui, sans-serif`)

**Character:** Sans-serif geometris yang tegas, hangat, dan mudah dipindai baik pada ukuran judul raksasa maupun teks antarmuka rapat.

### Hierarchy
- **Display** (`700`, `40px/44px` mobile · `64px/66px` desktop, `-0.02em`): Judul utama hero pada landing page dan angka hitungan mundur (`120px` mobile · `160px` desktop).
- **Headline** (`700`, `32px/36px` mobile · `44px/48px` desktop, `-0.02em`): Judul pembuka halaman dan bagian utama (`H1`/`H2`).
- **Title** (`700`, `20px/24px` mobile · `24px/28px` desktop, `-0.02em`): Judul di dalam kartu (`H3`).
- **Body** (`400`, `16px/24px`): Teks isi dan penjelasan dengan lebar baris maksimal `65ch`.
- **Label** (`500`–`700`, `14px/20px`): Label form, badge, chip status, dan keterangan waktu.

### Named Rules
**The Sentence Case Rule.** Seluruh judul, label, dan tombol ditulis dengan gaya kalimat biasa (sentence case). Dilarang memakai huruf kapital semua (`uppercase`) untuk label atau menandai satu kata dalam judul dengan warna berbeda.

## Layout

Konten dipusatkan dengan lebar maksimal `1120px` (`max-w-content`) dan titik henti responsif mobile-first mulai dari `360px`, `640px` (`sm`), hingga `1024px` (`lg`). Spasi mengikuti skala kelipatan `4px` (`4, 8, 12, 16, 24, 32, 48, 64`), dengan padding kartu `20px` di mobile dan `24px` di desktop. Di ruang sesi mobile, bilah kontrol menempel di bagian bawah layar dengan menghormati `env(safe-area-inset-bottom)`.

## Elevation & Depth

Kedalaman dibangun murni menggunakan **bayangan keras tanpa blur** berwarna `ink` (`#1A1A1A`) yang bergeser ke kanan-bawah, dikombinasikan dengan garis tepi `3px solid #1A1A1A`. Tidak ada bayangan lembut, gradien, atau efek kaca buram (`backdrop-filter`).

### Shadow Vocabulary
- **Hard Small** (`box-shadow: 3px 3px 0 0 #1A1A1A`): Dipakai untuk badge stiker, chip status, dan tombol dropdown profil.
- **Hard Default** (`box-shadow: 4px 4px 0 0 #1A1A1A`): Dipakai untuk semua tombol aksi, kelompok tab, menu dropdown, dan notifikasi toast.
- **Hard Large** (`box-shadow: 6px 6px 0 0 #1A1A1A`): Dipakai untuk kartu utama, tile video, lingkaran countdown, dan photostrip.

### Named Rules
**The Physical Press Rule.** Elemen interaktif yang memiliki bayangan keras bergeser `-1px, -1px` dengan bayangan `5px` saat hover, dan menekan penuh `4px, 4px` dengan bayangan `0` saat ditekan (`:active`).

## Shapes

Radius sudut mengikuti hirarki fungsi komponen, bukan satu nilai seragam:
- **Frame & Inner Alert** (`8px`): Bingkai tiap foto di dalam photostrip dan kotak pesan error form.
- **Interactive Controls** (`12px`): Tombol, input teks, kotak tab, dropdown, dan toast.
- **Surfaces & Video Tiles** (`20px`): Kartu konten, tile video, dan kontainer luar photostrip.
- **Asymmetric Feature Panel** (`40px` pada satu sudut): Panel sorotan `yellow` atau `pink` membulat `40px` hanya di satu sudut untuk menciptakan siluet khas Neo-Brutalist.
- **Pills & Avatars** (`9999px`): Badge, indikator progres, avatar, dan tombol bulat kamera/mikrofon (`56×56px`).

## Components

### Buttons
- **Shape:** Sudut membulat sedang (`12px`), tinggi minimal `48px` (`56px` untuk kontrol sesi), border `3px solid #1A1A1A`, bayangan `4px 4px 0 0 #1A1A1A`.
- **Primary:** Latar `coral` (`#FF5C5C`), teks `ink` (`#1A1A1A`) bobot `700`, padding `0 20px`.
- **Hover / Focus:** Naik `-1px, -1px` saat hover; rata ke bayangan `0` saat ditekan; outline `3px solid #1A1A1A` dengan offset `3px` saat fokus keyboard. Saat memuat, teks berubah menjadi `"Memproses…"` dan dinonaktifkan.
- **Secondary / Highlight / Accent:** Varian `purple` (`#A78BFA`), `yellow` (`#FFE066`), `teal` (`#36CFC0`), dan `white` (`#FFFFFF`).

### Chips
- **Style:** Bentuk pil (`9999px`), border `2px solid #1A1A1A`, padding `4px 12px`, teks `14px/20px` bobot `700` berwarna `ink`.
- **State:** `teal` untuk status terhubung/gratis, `yellow` untuk status menyambung/baru, `coral` untuk status terputus/suara mati.

### Cards / Containers
- **Corner Style:** `20px` (dengan opsi satu sudut `40px` pada panel sorotan).
- **Background:** `white` (`#FFFFFF`), `yellow` (`#FFE066`), `pink` (`#FFC9C4`), atau `teal` (`#36CFC0`).
- **Shadow Strategy:** `6px 6px 0 0 #1A1A1A` (`shadow-hard-lg`).
- **Border:** `3px solid #1A1A1A`.
- **Internal Padding:** `20px` (mobile) dan `24px` (desktop).

### Inputs / Fields
- **Style:** Latar `white` (`#FFFFFF`), border `3px solid #1A1A1A`, radius `12px`, tinggi `48px`, padding `0 16px`, label `14px` bobot `700` di atas input.
- **Focus:** Muncul bayangan keras `4px 4px 0 0 #1A1A1A` dan outline `3px solid #1A1A1A`.
- **Error / Disabled:** Border tetap `ink`, pesan kesalahan tampil di bawah dalam kotak `coral` berborder `2px` dengan ikon peringatan dan teks `ink`.

### Navigation
- **Style:** Kelompok tab dalam satu kotak berborder `3px solid #1A1A1A`, radius `12px`, bayangan `4px`, tiap sel dipisah garis `3px solid #1A1A1A`. Tab aktif berlatar `yellow` (`#FFE066`), tidak aktif `white` (`#FFFFFF`), mendukung navigasi tombol panah kiri/kanan.

### Photostrip & Video Tile (Signature Components)
- **Video Tile:** Rasio `4:3` di desktop dan `3:4` di mobile, border `4px solid #1A1A1A`, radius `20px`, bayangan `6px`. Dilengkapi chip nama di kiri-bawah, chip status koneksi di kanan-atas, dan overlay lingkaran `yellow` untuk hitungan mundur `3-2-1-Cekrek!`.
- **Photostrip:** Strip vertikal berborder `3px solid #1A1A1A`, bayangan `6px`, memuat deretan pasangan foto Host & Guest berborder `3px` (`8px` radius) serta tanda bintang retro dan label `"RuangFoto"` di bagian bawah.

## Do's and Don'ts

### Do:
- **Do** gunakan token warna, border `3px`, dan bayangan keras dari spesifikasi ini secara konsisten di seluruh halaman.
- **Do** sertakan ikon `lucide-react` (`strokeWidth={2.5}`) bersama label teks untuk setiap indikator status (kamera, mikrofon, koneksi).
- **Do** tampilkan banner hitung mundur penghapusan otomatis `1x24 jam` di bagian atas layar hasil dan sembunyikan tombol unduh bagi Guest.
- **Do** hormati `prefers-reduced-motion: reduce` dengan mematikan animasi skala dan rotasi masuk.

### Don't:
- **Don't** menggunakan bayangan berblur, gradien, efek kaca buram (`backdrop-filter`), atau border tipis abu-abu.
- **Don't** menggunakan emoji sebagai ikon struktural atau memutar tile video dan tombol kontrol.
- **Don't** menampilkan lebih dari satu tombol utama (`coral`) pada satu layar.
- **Don't** menampilkan tabel harga, paket berbayar, atau fitur yang terkunci di bagian mana pun.
