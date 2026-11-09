Viewed AGENT.md:1-66

Viewed package.json:1-29

Viewed \\File\\Project\\RuangFoto\\README.md

Viewed tsconfig.json:1-28

Viewed \\File\\Project\\RuangFoto\\next.config.ts

Viewed next.config.mjs:1-7

Viewed \\File\\Project\\RuangFoto\\next.config.js

Viewed .gitignore:1-29

Viewed tsconfig.tsbuildinfo

Viewed layout.tsx:1-35

Viewed page.tsx:1-600

Viewed .env.example:1-20

Viewed routes.d.ts:1-88

Viewed supabase.ts:1-102

Viewed types.ts:1-114

Viewed templates.ts:1-222

Viewed server-store.ts:1-800

Viewed canvas-composer.ts:1-392

Viewed server-store.ts:801-1238

Viewed route.ts:1-800

Viewed route.ts:1-133

Viewed route.ts:1-40

Viewed route.ts:1-43

Viewed route.ts:1-167

Viewed route.ts:801-924

Viewed resend.ts:1-432

Viewed route.ts:1-49

Viewed route.ts:1-234

Viewed route.ts:1-43

Viewed AuthContext.tsx:1-567

Viewed ToastContext.tsx:1-100

Viewed NeoPrimitives.tsx:1-608

Viewed RetroDecorations.tsx:1-90

Viewed DomainComponents.tsx:1-800

Viewed page.tsx:1-672

Viewed page.tsx:1-441

Viewed DomainComponents.tsx:801-1418

Viewed page.tsx:1-93

Viewed page.tsx:1-800

Viewed page.tsx:1-596

Viewed page.tsx:1-111

Viewed page.tsx:1-98

Viewed page.tsx:801-1399

Viewed globals.css:1-307

Viewed \\File\\Project\\RuangFoto\\tailwind.config.ts

Viewed tailwind.config.js:1-48

Viewed vercel.json:1-9

Viewed schema.sql:1-263

Viewed DesignRuangFoto.md:1-448

Viewed PRDRuangFoto.md:1-447

Viewed \\File\\Project\\RuangFoto\\PRD.md

Viewed \\File\\Project\\RuangFoto\\Evaluasi.md

Viewed \\File\\Project\\RuangFoto\\src\\middleware.ts

Viewed \\File\\Project\\RuangFoto\\src\\proxy.ts



> \[!IMPORTANT]

> \*\*Transparansi Batasan Lingkungan (\[`AGENT.md`](file:///e:/File/Project/RuangFoto/AGENT.md#L7-L16) — \*Think Before Coding / Don't Hide Confusion\*):\*\*

> Sesi ini sedang berjalan dalam mode \*\*Read-Only\*\* (hanya alat baca \[`view\_file`] yang aktif; alat tulis berkas ke disk belum diaktifkan pada mode sesi ini). Seluruh \*\*26 berkas kode sumber, skema SQL, konfigurasi, serta dokumen PRD \& Desain\*\* di \[`e:/File/Project/RuangFoto`](file:///e:/File/Project/RuangFoto) telah selesai dianalisis secara menyeluruh.

>

> Di bawah ini adalah isi lengkap laporan \*\*`Evaluasi.md`\*\*. Jika kamu mengaktifkan mode \*\*Agent / Write\*\*, saya dapat langsung menyimpan berkas ini ke `e:\\File\\Project\\RuangFoto\\Evaluasi.md` sekaligus menerapkan \*surgical patch\*-nya.



\---



\# Laporan Evaluasi Menyeluruh Sistem RuangFoto (`Evaluasi.md`)



\*\*Proyek:\*\* RuangFoto — Photobooth Jarak Jauh Gratis (Next.js 15 + React 19 + Supabase + WebRTC + Resend)  

\*\*Pedoman Analisis \& Eksekusi:\*\* \[`AGENT.md`](file:///e:/File/Project/RuangFoto/AGENT.md), \[`PRDRuangFoto.md`](file:///e:/File/Project/RuangFoto/PRDRuangFoto.md), \[`DesignRuangFoto.md`](file:///e:/File/Project/RuangFoto/DesignRuangFoto.md)  

\*\*Tanggal Evaluasi:\*\* 9 November 2026



\---



\## 0. Kerangka Berpikir Berdasarkan \[`AGENT.md`](file:///e:/File/Project/RuangFoto/AGENT.md)



1\. \*\*Think Before Coding (Eksplisitkan Asumsi \& Tradeoff):\*\*

&#x20;  - \*\*Asumsi Arsitektur:\*\* Aplikasi dirancang dengan \*dual-mode persistence\*—mengutamakan Supabase (PostgreSQL + Storage + Auth + Realtime) di produksi, dan jatuh ke \*local JSON store\* (`.data/ruangfoto-store.json`) saat berjalan lokal tanpa kredensial Supabase.

&#x20;  - \*\*Tradeoff Utama:\*\* Kemudahan \*fallback\* mode lokal/demo saat ini bercampur dengan jalur produksi sehingga membuka celah \*Account Takeover\* dan \*Fail-Open Authorization\* apabila langsung di-deploy ke publik.

2\. \*\*Simplicity First (Solusi Paling Sederhana tanpa Spekulasi):\*\*

&#x20;  - Tidak perlu mengganti arsitektur dengan layanan pihak ketiga berbayar atau \*framework\* baru. Seluruh celah keamanan, \*race condition\*, dan \*memory leak\* dapat ditutup menggunakan primitif bawaan (`rf\_session` HMAC cookie yang sudah ada, constraint tabel `public.photos`, dan pembersihan referensi memori).

3\. \*\*Surgical Changes (Ubah Hanya yang Bermasalah):\*\*

&#x20;  - Setiap rekomendasi perbaikan di laporan ini ditargetkan langsung ke baris fungsi yang bermasalah tanpa merombak komponen UI Neo-Brutalism yang sudah sesuai \[`DesignRuangFoto.md`](file:///e:/File/Project/RuangFoto/DesignRuangFoto.md).

4\. \*\*Goal-Driven Execution (Kriteria Verifikasi Terukur):\*\*

&#x20;  - Setiap temuan dilengkapi langkah reproduksi dan kriteria verifikasi (`verify`) yang konkret.



\---



\## 1. Ringkasan Eksekutif \& Matriks Kondisi Sistem



| Dimensi Evaluasi | Status Saat Ini | Jumlah Temuan | Ringkasan Risiko Utama |

| :--- | :--- | :---: | :--- |

| \*\*1. Keamanan Siber (Cybersecurity)\*\* | \*\*Kritis (Perlu Patch Segera)\*\* | 5 (2 Kritis, 2 Tinggi, 1 Sedang) | \*Account Takeover\* 0-klik via `/api/auth/sync`, otorisasi hasil foto \*fail-open\* saat tanpa cookie, dan ketiadaan autentikasi pada seluruh endpoint sesi/sinyal. |

| \*\*2. Keamanan Data \& Privasi (UU PDP)\*\* | \*\*Rentan\*\* | 4 (2 Tinggi, 2 Sedang) | Bucket `ruangfoto-media` disetel `public: true` dengan path yang mudah ditebak (`sessions/KODE/pose-1-host.jpg`), cookie sesi tidak dihapus saat logout, dan potensi \*orphan files\* di Storage lewat 24 jam. |

| \*\*3. Alur Logika \& Concurrency\*\* | \*\*Ada Bug Kritis\*\* | 5 (2 Tinggi, 3 Sedang) | \*Lost update race condition\* saat Host \& Guest mengunggah foto serempak di serverless, tombol "Konfirmasi verifikasi email" di `/login` yang selalu gagal `400`, serta \*buffer\* countdown `400ms` yang terlalu sempit dibanding interval polling `1200ms`. |

| \*\*4. Keamanan Kode (Code Security)\*\* | \*\*Cukup Baik dengan Catatan\*\* | 3 (1 Tinggi, 2 Sedang) | Fallback kunci rahasia HMAC statis di kode sumber dan endpoint `/api/cron/cleanup` yang \*fail-open\* jika `CRON\_SECRET` kosong. Validasi regex ID (`isSafeIdentifier`) dan sanitasi HTML email sudah baik. |

| \*\*5. Efisiensi Kode \& Kebocoran (Leaks)\*\* | \*\*Ada Leak Signifikan\*\* | 5 (1 Kritis, 3 Tinggi, 1 Sedang) | Pemanggilan `listUsers({ perPage: 1000 })` di setiap request auth (akan rusak total saat > 1.000 user), \*memory leak\* pada `globalForDb.\_\_rfSessionQueues`, serta beban polling ganda (3.750 request per sesi 15 menit). |

| \*\*6. Alur Kerja Sistem \& UI/UX\*\* | \*\*Sangat Baik\*\* | — | Kepatuhan terhadap \[`DesignRuangFoto.md`](file:///e:/File/Project/RuangFoto/DesignRuangFoto.md) dan \[`PRDRuangFoto.md`](file:///e:/File/Project/RuangFoto/PRDRuangFoto.md) sangat tinggi (token warna, aksesibilitas `aria-live`, keyboard tab navigation, dan `prefers-reduced-motion`). |



\---



\## 2. Analisis Alur Kerja Sistem (`System Workflow`)



\### 2.1 Diagram Arsitektur \& Alur Data Saat Ini



```mermaid

flowchart TD

&#x20;   subgraph Client\["Browser Klien (Next.js App Router)"]

&#x20;       LP\["Landing Page (/)"]

&#x20;       LG\["Login Page (/login)"]

&#x20;       APP\["Main App (/app)"]

&#x20;       SES\["Session Room (/app/session/\[kode])"]

&#x20;       RES\["Result Page (/app/result/\[id])"]

&#x20;       CVS\["HTML5 Canvas Composer (1080p)"]

&#x20;   end



&#x20;   subgraph API\["Next.js Route Handlers (Server)"]

&#x20;       AUTH\["/api/auth/sync \& /api/auth/verify"]

&#x20;       SAPI\["/api/sessions \& /api/sessions/\[kode]"]

&#x20;       SIG\["/api/sessions/\[kode]/signal"]

&#x20;       RAPI\["/api/results \& /api/results/\[id]"]

&#x20;       CRON\["/api/cron/cleanup"]

&#x20;   end



&#x20;   subgraph Storage\["Persistensi \& Layanan Eksternal"]

&#x20;       SB\_AUTH\["Supabase Auth"]

&#x20;       SB\_DB\["Supabase PostgreSQL (users, sessions, photos, results, signals)"]

&#x20;       SB\_ST\["Supabase Storage (ruangfoto-media)"]

&#x20;       SB\_RT\["Supabase Realtime Broadcast"]

&#x20;       LOCAL\_DB\[".data/ruangfoto-store.json (Fallback Lokal)"]

&#x20;       RESEND\["Resend Email API"]

&#x20;       WEBRTC\["WebRTC P2P (STUN Google + TURN OpenRelay)"]

&#x20;   end



&#x20;   LP --> LG --> AUTH

&#x20;   AUTH --> RESEND

&#x20;   AUTH --> SB\_AUTH

&#x20;   AUTH --> SB\_DB

&#x20;   AUTH --> LOCAL\_DB

&#x20;   APP --> SAPI

&#x20;   SES <-->|"Polling 1200ms + PATCH"| SAPI

&#x20;   SES <-->|"Polling 800ms + POST"| SIG

&#x20;   SES <-->|"Broadcast Signal"| SB\_RT

&#x20;   SES <-->|"Video/Audio Langsung"| WEBRTC

&#x20;   SAPI --> SB\_DB

&#x20;   SAPI --> SB\_ST

&#x20;   SAPI --> LOCAL\_DB

&#x20;   SES -->|"Semua Pose Lengkap"| RES

&#x20;   RES --> CVS

&#x20;   CVS -->|"PATCH compositeDataUrl"| RAPI

&#x20;   RAPI --> SB\_DB

&#x20;   RAPI --> SB\_ST

&#x20;   CRON -->|"Hapus >24 jam \& Sesi >15m"| SB\_DB

&#x20;   CRON --> SB\_ST

```



\### 2.2 Evaluasi Komponen per Lapisan

1\. \*\*Lapisan Tampilan \& Primitif UI (\[`NeoPrimitives.tsx`](file:///e:/File/Project/RuangFoto/src/components/ui/NeoPrimitives.tsx), \[`RetroDecorations.tsx`](file:///e:/File/Project/RuangFoto/src/components/ui/RetroDecorations.tsx), \[`DomainComponents.tsx`](file:///e:/File/Project/RuangFoto/src/components/ruangfoto/DomainComponents.tsx), \[`globals.css`](file:///e:/File/Project/RuangFoto/src/app/globals.css)):\*\*

&#x20;  - Implementasi desain Retro Neo-Brutalism sangat rapi dan konsisten dengan token \[`DesignRuangFoto.md`](file:///e:/File/Project/RuangFoto/DesignRuangFoto.md#L22-L97).

&#x20;  - Dukungan aksesibilitas (`role="tablist"`, navigasi tombol panah `ArrowLeft`/`ArrowRight`/`Home`/`End` di \[`RfTabs`](file:///e:/File/Project/RuangFoto/src/components/ui/NeoPrimitives.tsx#L131-L152), `aria-live="assertive"` pada \[`CountdownOverlay`](file:///e:/File/Project/RuangFoto/src/components/ruangfoto/DomainComponents.tsx#L366-L403), serta aturan `@media (prefers-reduced-motion: reduce)` di \[`globals.css`](file:///e:/File/Project/RuangFoto/src/app/globals.css#L280-L306)) sudah diterapkan dengan baik.

2\. \*\*Lapisan Autentikasi (\[`AuthContext.tsx`](file:///e:/File/Project/RuangFoto/src/context/AuthContext.tsx), \[`src/lib/resend.ts`](file:///e:/File/Project/RuangFoto/src/lib/resend.ts), \[`/api/auth/sync`](file:///e:/File/Project/RuangFoto/src/app/api/auth/sync/route.ts), \[`/api/auth/verify`](file:///e:/File/Project/RuangFoto/src/app/api/auth/verify/route.ts)):\*\*

&#x20;  - Menggabungkan Supabase Auth, pengiriman email verifikasi/reset via Resend menggunakan token HMAC-SHA256, dan cookie sesi `rf\_session` (`HttpOnly`). Namun pemisahan antara mode lokal/demo dan mode produksi belum tegas sehingga menimbulkan celah keamanan kritis pada endpoint `/api/auth/sync`.

3\. \*\*Lapisan Ruang Sesi \& WebRTC (\[`src/app/app/session/\[kode]/page.tsx`](file:///e:/File/Project/RuangFoto/src/app/app/session/%5Bkode%5D/page.tsx), \[`/api/sessions/\[kode]`](file:///e:/File/Project/RuangFoto/src/app/api/sessions/%5Bkode%5D/route.ts), \[`/api/sessions/\[kode]/signal`](file:///e:/File/Project/RuangFoto/src/app/api/sessions/%5Bkode%5D/signal/route.ts)):\*\*

&#x20;  - Menggunakan 3 jalur sinyal sekaligus (`BroadcastChannel` antar-tab lokal, Supabase Realtime Broadcast, dan HTTP polling `/signal`) sehingga reliabilitas penyambungan di berbagai kondisi cukup tinggi, tetapi menghasilkan duplikasi trafik jaringan yang besar.

4\. \*\*Lapisan Komposisi Kanvas \& Hasil (\[`src/lib/canvas-composer.ts`](file:///e:/File/Project/RuangFoto/src/lib/canvas-composer.ts), \[`src/app/app/result/\[id]/page.tsx`](file:///e:/File/Project/RuangFoto/src/app/app/result/%5Bid%5D/page.tsx)):\*\*

&#x20;  - Menangkap frame langsung dari sensor `<video>` lokal pada resolusi penuh (`1280x960`) dengan \*horizontal mirror\* dan merangkainya ke kanvas `1080px` (baik strip prosedural maupun overlay PNG transparan).



\---



\## 3. Analisis Keamanan Siber \& Celah Sistem (`Cybersecurity Audit`)



\### \[C-01] Kritis: Pemalsuan Identitas \& Account Takeover (ATO) Tanpa Autentikasi pada `POST /api/auth/sync`

\- \*\*Lokasi:\*\* \[`src/app/api/auth/sync/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/auth/sync/route.ts#L76-L152)

\- \*\*Mekanisme Celah:\*\*

&#x20; 1. Pada blok `if (action === 'sync' \&\& body.user)` (\[baris 76–85](file:///e:/File/Project/RuangFoto/src/app/api/auth/sync/route.ts#L76-L85)), server menerima objek `body.user` apa pun dari klien tanpa memverifikasi JWT Supabase atau bukti autentikasi lain, lalu mengeksekusi `await upsertUserProfile(profile)` dan \*\*`setSessionCookie(res, profile)`\*\*.

&#x20; 2. Pada blok `if (action === 'google-fallback')` (\[baris 87–152](file:///e:/File/Project/RuangFoto/src/app/api/auth/sync/route.ts#L87-L152)), server menerima `body.email` dan `body.name` tanpa token OAuth Google. Jika email tersebut sudah ada di Supabase (`findSupabaseUserByEmail(email)`), server langsung mengambil profil user tersebut dan menerbitkan cookie sesi `rf\_session` yang valid selama 7 hari.

\- \*\*Dampak:\*\* Penyerang dapat mengambil alih akun pengguna mana pun (termasuk melihat dan menghapus foto pribadi mereka) serta merusak data profil di tabel `public.users` hanya dengan mengetahui alamat email atau `userId` target.



\### \[C-02] Kritis: Otorisasi Fail-Open (Bypass IDOR) pada `/api/results/\[id]` dan `/api/results`

\- \*\*Lokasi:\*\*

&#x20; - \[`src/app/api/results/\[id]/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/results/%5Bid%5D/route.ts#L25-L34)

&#x20; - \[`src/app/api/results/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/results/route.ts#L26-L35)

\- \*\*Mekanisme Celah:\*\*

&#x20; Fungsi \[`isResultParticipant`](file:///e:/File/Project/RuangFoto/src/app/api/results/%5Bid%5D/route.ts#L25-L34) ditulis sebagai berikut:

&#x20; ```ts

&#x20; function isResultParticipant(req: NextRequest, result: PhotoboothResult): boolean {

&#x20;   const sessionCookie = req.cookies.get(SESSION\_COOKIE\_NAME)?.value || '';

&#x20;   if (!sessionCookie) return true; // <-- CELAH KRITIS: Fail-open jika tanpa cookie!

&#x20;   const payload = verifyAuthToken(sessionCookie, 'session');

&#x20;   if (!payload) return true;       // <-- CELAH KRITIS: Fail-open jika token rusak/expired!

&#x20;   return payload.sub === result.hostId || payload.sub === result.guestId;

&#x20; }

&#x20; ```

&#x20; Pola yang sama terdapat di \[`GET /api/results`](file:///e:/File/Project/RuangFoto/src/app/api/results/route.ts#L26-L35) (`if (sessionPayload \&\& sessionPayload.sub !== userId)`).

\- \*\*Dampak:\*\* Permintaan HTTP tanpa cookie `rf\_session` (misalnya melalui `curl` atau browser incognito) otomatis dianggap \*\*memiliki izin penuh\*\* untuk:

&#x20; - Mengambil seluruh daftar hasil foto milik `userId` mana pun via `GET /api/results?userId=...`

&#x20; - Mengambil hasil foto via `GET /api/results/\[id]` (termasuk pencarian berdasarkan `sessionCode` 6 karakter karena \[`getResultById`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts#L1005-L1007) mencocokkan `session\_code.ilike.${cleanId}`)

&#x20; - Menimpa gambar hasil dengan gambar lain via `PATCH /api/results/\[id]`

&#x20; - Menghapus hasil foto pasangan lain via `DELETE /api/results/\[id]`



\### \[C-03] Tinggi: Ketiadaan Autentikasi \& Verifikasi Kepemilikan Peran pada Endpoint Sesi dan Sinyal WebRTC

\- \*\*Lokasi:\*\*

&#x20; - \[`src/app/api/sessions/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/sessions/route.ts#L5-L35)

&#x20; - \[`src/app/api/sessions/\[kode]/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/sessions/%5Bkode%5D/route.ts#L11-L233)

&#x20; - \[`src/app/api/sessions/\[kode]/signal/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/sessions/%5Bkode%5D/signal/route.ts#L4-L42)

\- \*\*Mekanisme Celah:\*\*

&#x20; Tidak satu pun dari ketiga route handler di atas yang memeriksa cookie `rf\_session`. Pada `PATCH /api/sessions/\[kode]`, server langsung mempercayai properti `role` (`'host'` atau `'guest'`), `hostId`, atau `guestId` dari JSON body. Selain itu, kondisi penguncian 2 peserta di \[`route.ts:58-62`](file:///e:/File/Project/RuangFoto/src/app/api/sessions/%5Bkode%5D/route.ts#L58-L62):

&#x20; ```ts

&#x20; if (

&#x20;   current.guestId \&\&

&#x20;   current.guestId !== guestId \&\&

&#x20;   current.guestId !== 'simulated\_partner' \&\&

&#x20;   guestId !== 'simulated\_partner' // <-- Siapa pun yang mengirim guestId: 'simulated\_partner' dapat menimpa guest asli!

&#x20; )

&#x20; ```

&#x20; mengizinkan pihak mana pun mengirim `{ "action": "join-guest", "guestId": "simulated\_partner" }` untuk mendepak Guest asli yang sedang berada di dalam sesi.

\- \*\*Dampak:\*\* Pihak ketiga yang mengetahui atau menebak kode sesi 6 karakter (`XXX-XXX`, ruang kombinasi $32^6 = 1{,}07 \\times 10^9$) dapat membaca foto sesi, menyuntikkan foto ke slot Host/Guest, mereset sesi (`retake-all`), atau memutus koneksi WebRTC dengan mengirim sinyal SDP palsu.



\### \[C-04] Tinggi: Fallback Secret HMAC Statis \& Endpoint Cron Pembersihan Tanpa Proteksi Default

\- \*\*Lokasi:\*\*

&#x20; - \[`src/lib/resend.ts`](file:///e:/File/Project/RuangFoto/src/lib/resend.ts#L8-L11)

&#x20; - \[`src/app/api/cron/cleanup/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/cron/cleanup/route.ts#L4-L9)

\- \*\*Mekanisme Celah:\*\*

&#x20; - Di \[`src/lib/resend.ts`](file:///e:/File/Project/RuangFoto/src/lib/resend.ts#L8-L11), jika `AUTH\_TOKEN\_SECRET` dan `SUPABASE\_SERVICE\_ROLE\_KEY` tidak terdefinisi di environment, `tokenSecret` jatuh ke nilai konstanta `'ruangfoto-auth-hmac-secret-key-2026'`.

&#x20; - Di \[`src/app/api/cron/cleanup/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/cron/cleanup/route.ts#L4-L9), `if (!cronSecret) return true;` mengizinkan siapa saja memanggil `GET/POST /api/cron/cleanup` yang menjalankan `cleanupExpiredData(true)` (`force = true`, mengabaikan \*throttle\* 2 menit) jika variabel `CRON\_SECRET` belum diatur.



\### \[C-05] Sedang: Rate Limiter In-Memory Mudah Di-bypass via Spoofing Header `x-forwarded-for`

\- \*\*Lokasi:\*\*

&#x20; - \[`src/lib/resend.ts`](file:///e:/File/Project/RuangFoto/src/lib/resend.ts#L180-L206)

&#x20; - \[`src/app/api/results/\[id]/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/results/%5Bid%5D/route.ts#L17-L23)

\- \*\*Mekanisme Celah:\*\*

&#x20; - `getClientRateKey` mengambil elemen pertama dari `req.headers.get('x-forwarded-for')` yang dapat dipalsukan oleh klien jika tidak berada di belakang proxy yang menimpa header tersebut.

&#x20; - Pada endpoint `POST /api/auth/sync` (`login-email`, `register-email`, `forgot-password`), rate limit hanya dikunci berdasarkan alamat `email` (`login:${cleanEmail}`), bukan kombinasi IP + email. Penyerang dapat melakukan \*credential stuffing\* lintas ribuan email tanpa terkena rate limit, atau sebaliknya melakukan DoS mengunci akun pengguna tertentu dengan mengirim 10 percobaan login gagal ke email korban.



\---



\## 4. Analisis Keamanan Data \& Privasi (`Data Security \& UU PDP Compliance`)



\### \[D-01] Tinggi: Bucket Supabase Storage `ruangfoto-media` Bersifat Publik dengan Path File yang Mudah Ditebak

\- \*\*Lokasi:\*\* \[`src/lib/server-store.ts`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts#L113-L129), \[`L165-L195`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts#L165-L195), \[`L739-L746`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts#L739-L746)

\- \*\*Analisis Masalah:\*\*

&#x20; - Sesuai \[`PRDRuangFoto.md`](file:///e:/File/Project/RuangFoto/PRDRuangFoto.md#L282-L285) dan halaman \[`/privacy`](file:///e:/File/Project/RuangFoto/src/app/privacy/page.tsx#L61-L72), foto harus disimpan secara \*\*privat\*\* dan hanya Host yang boleh mengunduh hasil akhir.

&#x20; - Namun \[`ensureStorageBucket()`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts#L120-L123) membuat bucket dengan opsi `{ public: true }`, dan \[`storePosePhoto()`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts#L740) menyimpan file menggunakan path deterministik `sessions/${sessionCode}/pose-${poseNumber}-${role}.jpg`.

&#x20; - Selain itu, Guest menerima seluruh URL foto beresolusi penuh (`hostDataUrl`, `guestDataUrl`, `compositeDataUrl`) melalui API `/api/results/\[id]`, sehingga pembatasan "Hanya Host yang bisa mengunduh" hanya bersifat kosmetik di UI (Guest tetap dapat menyimpan gambar penuh lewat klik kanan atau tab Network).



\### \[D-02] Tinggi: Ketidaksinkronan RLS Supabase saat `SUPABASE\_SERVICE\_ROLE\_KEY` Kosong

\- \*\*Lokasi:\*\* \[`src/lib/supabase.ts`](file:///e:/File/Project/RuangFoto/src/lib/supabase.ts#L32-L44) \& \[`supabase/schema.sql`](file:///e:/File/Project/RuangFoto/supabase/schema.sql#L189-L239)

\- \*\*Analisis Masalah:\*\*

&#x20; - Di \[`getSupabaseAdminClient()`](file:///e:/File/Project/RuangFoto/src/lib/supabase.ts#L34), terdapat baris `const key = supabaseServiceRoleKey || supabaseAnonKey;`.

&#x20; - Kebijakan RLS di \[`supabase/schema.sql`](file:///e:/File/Project/RuangFoto/supabase/schema.sql#L200-L239) mewajibkan `auth.uid()::text = host\_id or auth.uid()::text = guest\_id`.

&#x20; - Jika developer mengisi `NEXT\_PUBLIC\_SUPABASE\_URL` dan `NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY` tetapi lupa mengisi `SUPABASE\_SERVICE\_ROLE\_KEY`, maka `getSupabaseAdminClient()` berjalan sebagai `anon` (`auth.uid()` adalah `null`). Akibatnya:

&#x20;   1. Saat sesi dibuat (`status = 'menunggu'`), `INSERT` berhasil karena policy mengizinkan `status = 'menunggu'`.

&#x20;   2. Begitu Guest bergabung dan status berubah menjadi `'berjalan'`, seluruh operasi `SELECT`/`UPDATE` berikutnya dari server ditolak oleh RLS, dan server diam-diam jatuh ke `.data/ruangfoto-store.json` lokal (\*split-brain data inconsistency\*)!



\### \[D-03] Sedang: Risiko File Foto Orphan di Supabase Storage (Tidak Terhapus Setelah 1x24 Jam)

\- \*\*Lokasi:\*\*

&#x20; - \[`supabase/schema.sql`](file:///e:/File/Project/RuangFoto/supabase/schema.sql#L242-L262) (`cleanup\_expired\_ruangfoto\_data`)

&#x20; - \[`src/lib/server-store.ts`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts#L850-L870) (`updateSessionByCodeInternal`)

\- \*\*Analisis Masalah:\*\*

&#x20; 1. Jika fungsi PostgreSQL `cleanup\_expired\_ruangfoto\_data()` dijalankan terlebih dahulu (misalnya oleh jadwal `pg\_cron` di Supabase), fungsi tersebut langsung melakukan `DELETE FROM public.photos WHERE expires\_at <= now();` dan `DELETE FROM public.results WHERE expires\_at <= now();` di database \*\*tanpa menghapus objek file di Supabase Storage\*\*. Ketika `/api/cron/cleanup` berjalan sesudahnya, tabel `photos` dan `results` sudah kosong sehingga `storagePathsToRemove` menjadi kosong, dan \*\*file foto fisik tetap tersimpan selamanya di bucket Supabase Storage\*\*.

&#x20; 2. Ketika pengguna menekan \*\*"Foto ulang"\*\* (`retake-all`) dari halaman hasil, baris lama di tabel `results` dihapus, tetapi file `results/${previousResultId}.png` di Supabase Storage tidak ikut dihapus.



\### \[D-04] Sedang: Cookie Sesi `rf\_session` Tidak Dihapus Saat `logout()` \& Penyimpanan Akun Lokal di `localStorage`

\- \*\*Lokasi:\*\* \[`src/context/AuthContext.tsx`](file:///e:/File/Project/RuangFoto/src/context/AuthContext.tsx#L70-L92), \[`L509-L515`](file:///e:/File/Project/RuangFoto/src/context/AuthContext.tsx#L509-L515)

\- \*\*Analisis Masalah:\*\*

&#x20; - Fungsi \[`logout()`](file:///e:/File/Project/RuangFoto/src/context/AuthContext.tsx#L509-L515) hanya memanggil `supabase.auth.signOut()` dan menghapus `localStorage`/`sessionStorage`, tetapi tidak memanggil `/api/auth/sync` untuk menghapus cookie `HttpOnly` `rf\_session`.

&#x20; - Selain itu, pada `deleteAccount()` di \[`AuthContext.tsx:519`](file:///e:/File/Project/RuangFoto/src/context/AuthContext.tsx#L519), pemanggilan `DELETE /api/auth/sync` dibungkus `if (isSupabaseConfigured)`, sehingga pada mode lokal akun di `.data/ruangfoto-store.json` dan cookie `rf\_session` tidak dihapus dari server.



\---



\## 5. Analisis Alur Logika, Bug \& Concurrency (`Logic Flow Audit`)



\### \[L-01] Tinggi: Race Condition \*Lost Update\* saat Host \& Guest Mengunggah Foto Serempak

\- \*\*Lokasi:\*\*

&#x20; - \[`src/app/api/sessions/\[kode]/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/sessions/%5Bkode%5D/route.ts#L119-L184)

&#x20; - \[`src/lib/server-store.ts`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts#L772-L890)

\- \*\*Urutan Kejadian Bug:\*\*

&#x20; ```mermaid

&#x20; sequenceDiagram

&#x20;     participant Host

&#x20;     participant InstanceA as Server Instance A

&#x20;     participant InstanceB as Server Instance B

&#x20;     participant Guest

&#x20;     participant DB as Supabase PostgreSQL



&#x20;     Note over Host,Guest: Countdown mencapai 0 ("Cekrek!") secara bersamaan

&#x20;     Host->>InstanceA: PATCH /api/sessions/KODE (upload-photo, role: host)

&#x20;     Guest->>InstanceB: PATCH /api/sessions/KODE (upload-photo, role: guest)

&#x20;     InstanceA->>DB: storePosePhoto (INSERT public.photos role=host)

&#x20;     InstanceB->>DB: storePosePhoto (INSERT public.photos role=guest)

&#x20;     InstanceA->>DB: SELECT sessions WHERE code='KODE' (poses\[0]: kosong)

&#x20;     InstanceB->>DB: SELECT sessions WHERE code='KODE' (poses\[0]: kosong)

&#x20;     InstanceA->>DB: UPDATE sessions SET poses=\[{hostDataUrl: '...'}]

&#x20;     InstanceB->>DB: UPDATE sessions SET poses=\[{guestDataUrl: '...'}] (MENIMPA hostDataUrl!)

&#x20; ```

\- \*\*Analisis:\*\* Antrean `globalForDb.\_\_rfSessionQueues` hanya bekerja di dalam satu proses memori Node.js. Di Vercel Functions (multi-instance) atau saat terjadi jeda jaringan pada `storePosePhoto`, pembacaan-modifikasi-penulisan (\*read-modify-write\*) kolom JSONB `sessions.poses` dari dua peserta akan saling menimpa.

\- \*\*Gejala di Pengguna:\*\* Salah satu foto pose hilang meskipun kedua peserta sudah mengunggahnya, `currentPose` tidak bertambah, dan 15 detik kemudian muncul banner kuning \*"Unggahan foto pose dari salah satu sisi terhambat koneksi"\*.



\### \[L-02] Tinggi: Tombol "Konfirmasi verifikasi email" di `/login` Selalu Gagal `400 Bad Request`

\- \*\*Lokasi:\*\*

&#x20; - \[`src/app/login/page.tsx`](file:///e:/File/Project/RuangFoto/src/app/login/page.tsx#L195-L209) \& \[`L334-L347`](file:///e:/File/Project/RuangFoto/src/app/login/page.tsx#L334-L347)

&#x20; - \[`src/app/api/auth/sync/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/auth/sync/route.ts#L410-L441)

\- \*\*Analisis Bug:\*\*

&#x20; - Setelah pengguna mendaftar dengan email, layar beralih ke `viewMode === 'verify'` yang menampilkan tombol utama \*\*"Konfirmasi verifikasi email"\*\*.

&#x20; - Saat diklik, \[`handleCompleteVerification`](file:///e:/File/Project/RuangFoto/src/app/login/page.tsx#L195-L209) memanggil `verifyEmailAccount(email)` \*\*tanpa parameter `token`\*\*.

&#x20; - Di \[`src/app/api/auth/sync/route.ts:416-441`](file:///e:/File/Project/RuangFoto/src/app/api/auth/sync/route.ts#L416-L441), `action === 'verify-email'` menolak request jika `rawToken` kosong (`!tokenVerified`), bahkan jika pengguna \*\*sudah mengklik link verifikasi di email mereka\*\* (misalnya di aplikasi Gmail HP)!

&#x20; - Selain itu, pada \[`GET /api/auth/verify`](file:///e:/File/Project/RuangFoto/src/app/api/auth/verify/route.ts#L97-L132), endpoint tersebut sudah memverifikasi token dan memanggil `markEmailVerified()`, tetapi \*\*belum langsung menyetel cookie `rf\_session`\*\* pada response redirect, melainkan memaksa browser melakukan `POST /api/auth/sync` kedua kali di `LoginPage`.



\### \[L-03] Sedang: Buffer `countdownStartedAt` (`+400ms`) Lebih Kecil dari Interval Polling (`1200ms`)

\- \*\*Lokasi:\*\*

&#x20; - \[`src/app/api/sessions/\[kode]/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/sessions/%5Bkode%5D/route.ts#L111-L113)

&#x20; - \[`src/app/app/session/\[kode]/page.tsx`](file:///e:/File/Project/RuangFoto/src/app/app/session/%5Bkode%5D/page.tsx#L240-L242), \[`L847-L854`](file:///e:/File/Project/RuangFoto/src/app/app/session/%5Bkode%5D/page.tsx#L847-L854)

\- \*\*Analisis Bug:\*\*

&#x20; - Saat peserta ke-2 menekan \*\*Siap\*\*, server menetapkan `countdownStartedAt = Date.now() + 400`.

&#x20; - Peserta ke-2 menerima nilai tersebut langsung dari respons HTTP `PATCH`, sedangkan peserta ke-1 baru mengetahuinya setelah menerima sinyal `state-sync` lalu memanggil `fetchSessionState()` (`GET /api/sessions/\[kode]`) atau menunggu siklus polling `1200ms`.

&#x20; - Waktu tempuh \*signal + HTTP GET\* rata-rata di jaringan 4G adalah `300ms–900ms`. Akibatnya, saat peserta ke-1 menerima `countdownStartedAt`, waktu `countdownStartedAt` sudah terlewati (`delayUntilStart = 0`), sehingga jepretan kedua peserta dapat berselisih hingga `0,5–1 detik`.

&#x20; - Selain itu, perhitungan `serverOffsetRef.current = data.serverTime - Date.now()` belum dikompensasi dengan setengah \*Round-Trip Time\* ($\\text{RTT}/2$).



\### \[L-04] Sedang: Sinyal WebRTC `offer` Pertama Dapat Hilang jika Guest Baru Terhubung

\- \*\*Lokasi:\*\* \[`src/app/app/session/\[kode]/page.tsx`](file:///e:/File/Project/RuangFoto/src/app/app/session/%5Bkode%5D/page.tsx#L481-L516), \[`L541-L547`](file:///e:/File/Project/RuangFoto/src/app/app/session/%5Bkode%5D/page.tsx#L541-L547)

\- \*\*Analisis Bug:\*\*

&#x20; - Begitu Host melihat `session.guestId` terisi dari hasil polling, Host langsung memanggil `startWebRTCOffer(false)` yang mengubah `pc.signalingState` menjadi `'have-local-offer'`.

&#x20; - Beberapa ratus milidetik kemudian, kamera Guest selesai diinisialisasi (`localMediaReady = true`) dan Guest mengirim sinyal `'peer-ready'`.

&#x20; - Saat Host menerima `'peer-ready'`, Host memanggil `startWebRTCOffer(false)`, namun di baris 485 terdapat penjaga `if (!isRestart \&\& pc.signalingState !== 'stable') return;`! Jika Guest melewatkan `offer` pertama (misalnya karena channel Realtime Guest belum selesai subscribe), Host tidak mengirim ulang `offer` tersebut karena `signalingState` masih `'have-local-offer'`.



\### \[L-05] Sedang: Ketidaksesuaian Jumlah Template dengan PRD \& Jadwal Cron Hobby Plan

\- \*\*Lokasi:\*\* \[`src/lib/templates.ts`](file:///e:/File/Project/RuangFoto/src/lib/templates.ts#L24-L217) \& \[`vercel.json`](file:///e:/File/Project/RuangFoto/vercel.json#L1-L9)

\- \*\*Analisis:\*\*

&#x20; - `INITIAL\_TEMPLATES` saat ini berisi \*\*10 template\*\* (3 prosedural + 7 bingkai PNG), sedangkan \[`PRDRuangFoto.md`](file:///e:/File/Project/RuangFoto/PRDRuangFoto.md#L48) menyebutkan 3 template saat rilis (hal ini tidak merusak fungsi, justru memperkaya pilihan template selama seluruh file PNG di `public/templates/` tersedia).

&#x20; - Di \[`vercel.json`](file:///e:/File/Project/RuangFoto/vercel.json), cron dijadwalkan `"0 0 \* \* \*"` (sekali sehari). Jika aplikasi sepi pengunjung, penghapusan otomatis di luar request aktif hanya terjadi setiap 24 jam sekali.



\---



\## 6. Analisis Efisiensi Kode \& Kebocoran Sistem (`Leaks \& Performance Bottlenecks`)



\### \[E-01] Kritis (Bottleneck \& Scalability Bug): `sb.auth.admin.listUsers({ perPage: 1000 })` pada Setiap Aksi Auth

\- \*\*Lokasi:\*\*

&#x20; - \[`src/app/api/auth/sync/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/auth/sync/route.ts#L55-L68) (`findSupabaseUserByEmail`)

&#x20; - \[`src/app/api/auth/verify/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/auth/verify/route.ts#L25-L32) (`markEmailVerified`)

\- \*\*Analisis Kebocoran \& Bottleneck:\*\*

&#x20; - Mengunduh hingga 1.000 baris user dari Supabase Auth ke memori server pada setiap request login/registrasi/verifikasi/reset memiliki kompleksitas waktu dan memori $O(N)$.

&#x20; - \*\*Kegagalan Sistem di > 1.000 User:\*\* Saat pengguna ke-1.001 mendaftar, `listUsers({ perPage: 1000 })` hanya mengembalikan halaman pertama (1.000 user pertama), sehingga `findSupabaseUserByEmail` mengembalikan `null` dan fitur verifikasi email maupun reset password gagal total bagi pengguna baru.



\### \[E-02] Tinggi (Memory Leak): Kebocoran Memori pada `globalForDb.\_\_rfSessionQueues` \& `db.signals`

\- \*\*Lokasi:\*\* \[`src/lib/server-store.ts`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts#L58-L63), \[`L527-L533`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts#L527-L533), \[`L772-L790`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts#L772-L790)

\- \*\*Analisis Kebocoran Memori:\*\*

&#x20; 1. `queues.set(normalized, task)` menyimpan `Promise<PhotoboothSession | null>` ke dalam `Map` global tanpa pernah memanggil `queues.delete(normalized)`. Karena nilai \*resolved\* dari promise adalah objek `PhotoboothSession` (yang dapat memuat string base64 foto berukuran beberapa MB), \*Garbage Collector\* V8 tidak dapat membebaskan memori sesi terakhir dari setiap kode sesi yang pernah aktif!

&#x20; 2. Pada \[`cleanupExpiredData`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts#L492-L534), sesi yang sudah kedaluwarsa (`status === 'kedaluwarsa'`) dan lebih tua dari 24 jam, serta array kosong `db.signals\[code] = \[]`, tidak pernah di-`delete` dari objek `db.sessions` dan `db.signals`, sehingga memori cache `\_\_rfDbCache` dan ukuran file `.data/ruangfoto-store.json` terus bertambah tanpa batas.

&#x20; 3. Di sisi klien (\[`session/\[kode]/page.tsx:79`](file:///e:/File/Project/RuangFoto/src/app/app/session/%5Bkode%5D/page.tsx#L79)), `processedSignalIdsRef.current` (`Set<string>`) tidak dibatasi ukurannya.



\### \[E-03] Tinggi (Network \& Serverless Bottleneck): Polling HTTP Ganda Tanpa \*In-Flight Guard\* (`800ms` + `1200ms`)

\- \*\*Lokasi:\*\* \[`src/app/app/session/\[kode]/page.tsx`](file:///e:/File/Project/RuangFoto/src/app/app/session/%5Bkode%5D/page.tsx#L295-L299), \[`L675-L697`](file:///e:/File/Project/RuangFoto/src/app/app/session/%5Bkode%5D/page.tsx#L675-L697)

\- \*\*Analisis Efisiensi:\*\*

&#x20; - Dua `setInterval` (`1200ms` untuk sesi dan `800ms` untuk sinyal) terus menembak server tanpa memeriksa apakah request sebelumnya sudah selesai (\*request pile-up\* pada jaringan lambat) dan tanpa melambat ketika koneksi WebRTC (`peerState === 'terhubung'`) serta Supabase Realtime sudah aktif.



\### \[E-04] Tinggi (I/O Blocking): Penulisan Sinkron `writeLocalDb` pada `upsertUserProfile` Meski Supabase Aktif

\- \*\*Lokasi:\*\* \[`src/lib/server-store.ts`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts#L329-L366)

\- \*\*Analisis Efisiensi:\*\*

&#x20; - Berbeda dengan fungsi lain yang hanya menyentuh `readLocalDb()`/`writeLocalDb()` sebagai \*fallback\* saat Supabase tidak terkonfigurasi, `upsertUserProfile` \*\*selalu\*\* memanggil `readLocalDb()` dan `writeLocalDb(db)` di baris 334–344 sebelum melakukan upsert ke Supabase. Di lingkungan serverless (Vercel), direktori `process.cwd()` bersifat \*read-only\* sehingga `fs.mkdirSync`/`fs.writeFileSync` selalu melempar exception yang ditangkap oleh `catch {}` pada setiap login/registrasi.



\### \[E-05] Sedang (Client CPU/RAM): Pemuatan Gambar Sekuensial \& Komposisi Ulang Kanvas di Layar Hasil

\- \*\*Lokasi:\*\*

&#x20; - \[`src/lib/canvas-composer.ts`](file:///e:/File/Project/RuangFoto/src/lib/canvas-composer.ts#L215-L247), \[`L325-L362`](file:///e:/File/Project/RuangFoto/src/lib/canvas-composer.ts#L325-L362)

&#x20; - \[`src/app/app/result/\[id]/page.tsx`](file:///e:/File/Project/RuangFoto/src/app/app/result/%5Bid%5D/page.tsx#L59-L110)

\- \*\*Analisis Efisiensi:\*\*

&#x20; - Di \[`canvas-composer.ts`](file:///e:/File/Project/RuangFoto/src/lib/canvas-composer.ts#L234-L243), `await loadImage(src)` dipanggil satu per satu di dalam loop `for`. Memuat 8 gambar pose + 1 gambar bingkai PNG secara paralel dengan `Promise.all` akan memangkas waktu \*composing\* hingga 70–80%.

&#x20; - Di \[`result/\[id]/page.tsx`](file:///e:/File/Project/RuangFoto/src/app/app/result/%5Bid%5D/page.tsx#L79-L100), jika `loaded.compositeDataUrl` sudah tersedia dari server, browser sebenarnya dapat langsung menyetel `setHdPngUrl(loaded.compositeDataUrl)` tanpa harus merender ulang kanvas PNG di awal.



\---



\## 7. Rencana Penyelesaian Optimal (`Surgical Changes \& Verification Plan`)



Sesuai \[`AGENT.md` Bagian 2, 3, dan 4](file:///e:/File/Project/RuangFoto/AGENT.md#L17-L61), berikut adalah rencana penyelesaian paling optimal dengan perubahan kode seminimal mungkin (\*surgical\*) beserta kriteria verifikasinya:



\### Langkah 1: Tutup Celah Autentikasi, Account Takeover \& Logout Cookie

\- \*\*Target Berkas:\*\* \[`src/app/api/auth/sync/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/auth/sync/route.ts), \[`src/app/api/auth/verify/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/auth/verify/route.ts), \[`src/context/AuthContext.tsx`](file:///e:/File/Project/RuangFoto/src/context/AuthContext.tsx), \[`src/lib/resend.ts`](file:///e:/File/Project/RuangFoto/src/lib/resend.ts)

\- \*\*Perubahan Surgical:\*\*

&#x20; 1. Pada `action === 'sync'` di \[`/api/auth/sync`](file:///e:/File/Project/RuangFoto/src/app/api/auth/sync/route.ts#L76-L85): jika `isSupabaseConfigured`, wajibkan verifikasi `accessToken` menggunakan `ephemeralClient.auth.getUser(body.accessToken)` dan pastikan `data.user.id === profile.id`.

&#x20; 2. Pada `action === 'google-fallback'` (\[baris 87](file:///e:/File/Project/RuangFoto/src/app/api/auth/sync/route.ts#L87)): batasi hanya jika `process.env.NODE\_ENV !== 'production'`.

&#x20; 3. Tambahkan `action === 'logout'` di `/api/auth/sync` yang menjalankan `res.cookies.delete(SESSION\_COOKIE\_NAME)` dan panggil saat `logout()` di \[`AuthContext.tsx`](file:///e:/File/Project/RuangFoto/src/context/AuthContext.tsx#L509-L515).

&#x20; 4. Pada `action === 'verify-email'` (\[baris 410](file:///e:/File/Project/RuangFoto/src/app/api/auth/sync/route.ts#L410)): jika `rawToken` tidak disertakan (saat pengguna menekan tombol \*"Konfirmasi verifikasi email"\* di tab pendaftaran awal), periksa apakah `sbUser?.email\_confirmed\_at || localUser?.verified` sudah bernilai `true` di database; jika sudah, izinkan login dan terbitkan cookie `rf\_session`. Setel juga cookie `rf\_session` langsung pada `GET /api/auth/verify`.

&#x20; 5. Ganti `findSupabaseUserByEmail` agar mencari `id` melalui indeks tabel `public.users` (`sb.from('users').select('id').eq('email', cleanEmail).maybeSingle()`) lalu memanggil `sb.auth.admin.getUserById(id)` ($O(1)$) alih-alih `listUsers({ perPage: 1000 })`.

\- \*\*Verify:\*\*

&#x20; - Request `POST /api/auth/sync` dengan `{ action: 'sync', user: { id: 'usr\_lain', email: 'korban@mail.com' } }` tanpa `accessToken` valid ditolak dengan `401`.

&#x20; - Klik tautan verifikasi di email lalu tekan tombol "Konfirmasi verifikasi email" di tab awal berhasil masuk (`200 OK`).

&#x20; - Saat `logout()`, cookie `rf\_session` terhapus dari browser.



\### Langkah 2: Ubah Otorisasi Hasil \& Sesi Menjadi \*Fail-Closed\*

\- \*\*Target Berkas:\*\* \[`src/app/api/results/\[id]/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/results/%5Bid%5D/route.ts), \[`src/app/api/results/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/results/route.ts), \[`src/app/api/sessions/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/sessions/route.ts), \[`src/app/api/sessions/\[kode]/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/sessions/%5Bkode%5D/route.ts), \[`src/app/api/cron/cleanup/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/cron/cleanup/route.ts)

\- \*\*Perubahan Surgical:\*\*

&#x20; 1. Di \[`src/app/api/results/\[id]/route.ts:25-34`](file:///e:/File/Project/RuangFoto/src/app/api/results/%5Bid%5D/route.ts#L25-L34):

&#x20;    ```ts

&#x20;    function isResultParticipant(req: NextRequest, result: PhotoboothResult): boolean {

&#x20;      const sessionCookie = req.cookies.get(SESSION\_COOKIE\_NAME)?.value || '';

&#x20;      if (!sessionCookie) return false;

&#x20;      const payload = verifyAuthToken(sessionCookie, 'session');

&#x20;      if (!payload) return false;

&#x20;      return payload.sub === result.hostId || payload.sub === result.guestId;

&#x20;    }

&#x20;    ```

&#x20; 2. Di \[`src/app/api/results/route.ts:26-35`](file:///e:/File/Project/RuangFoto/src/app/api/results/route.ts#L26-L35): tolak dengan `401`/`403` jika `!sessionPayload || sessionPayload.sub !== userId`.

&#x20; 3. Di \[`src/app/api/sessions/\[kode]/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/sessions/%5Bkode%5D/route.ts): verifikasi cookie `rf\_session` dan pastikan pemanggil adalah `current.hostId` atau `current.guestId`, serta hanya `hostId` yang boleh mengaktifkan `guestId === 'simulated\_partner'`.

&#x20; 4. Di \[`src/app/api/cron/cleanup/route.ts:6`](file:///e:/File/Project/RuangFoto/src/app/api/cron/cleanup/route.ts#L6): ubah `if (!cronSecret) return process.env.NODE\_ENV !== 'production';`.

\- \*\*Verify:\*\*

&#x20; - Request `GET /api/results/\[id]` dan `DELETE /api/results/\[id]` tanpa cookie `rf\_session` ditolak dengan `403`.

&#x20; - Pengguna ketiga yang bukan Host/Guest tidak dapat memodifikasi sesi via `PATCH /api/sessions/\[kode]`.



\### Langkah 3: Eliminasi \*Race Condition\* Unggah Foto \& Perbaiki Sinkronisasi Countdown

\- \*\*Target Berkas:\*\* \[`src/lib/server-store.ts`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts), \[`src/app/api/sessions/\[kode]/route.ts`](file:///e:/File/Project/RuangFoto/src/app/api/sessions/%5Bkode%5D/route.ts), \[`src/app/app/session/\[kode]/page.tsx`](file:///e:/File/Project/RuangFoto/src/app/app/session/%5Bkode%5D/page.tsx)

\- \*\*Perubahan Surgical:\*\*

&#x20; 1. Di \[`updateSessionByCodeInternal`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts#L792-L840): saat Supabase aktif, ambil baris foto sesi dari tabel `public.photos` (`sb.from('photos').select('pose\_number, owner\_role, public\_url').eq('session\_id', existing.id)`) dan gabungkan ke `updated.poses` sebelum mengecek `allPosesComplete`. Karena setiap foto pose disimpan di baris terpisah `(session\_id, pose\_number, owner\_role)` pada tabel `public.photos`, unggahan paralel dari Host dan Guest tidak akan pernah saling menimpa!

&#x20; 2. Di \[`src/app/api/sessions/\[kode]/route.ts:112`](file:///e:/File/Project/RuangFoto/src/app/api/sessions/%5Bkode%5D/route.ts#L112): ubah `Date.now() + 400` menjadi `Date.now() + 1200` agar kedua klien memiliki waktu cukup menerima jadwal countdown sebelum angka `3` muncul.

&#x20; 3. Di \[`src/app/app/session/\[kode]/page.tsx:541-547`](file:///e:/File/Project/RuangFoto/src/app/app/session/%5Bkode%5D/page.tsx#L541-L547): saat Host menerima sinyal `'peer-ready'`, panggil `await startWebRTCOffer(true)` jika koneksi belum `'connected'` agar `offer` selalu terkirim ulang meskipun `signalingState` sebelumnya `'have-local-offer'`.

\- \*\*Verify:\*\*

&#x20; - Simulasikan Host dan Guest mengunggah foto pada milidetik yang sama (`Promise.all` dua request `PATCH upload-photo`) → kedua URL foto (`hostDataUrl` dan `guestDataUrl`) tersimpan lengkap dan `currentPose` naik ke pose berikutnya tanpa \*lost update\*.



\### Langkah 4: Bersihkan Memory Leak, Storage Leak \& Optimalkan Polling

\- \*\*Target Berkas:\*\* \[`src/lib/server-store.ts`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts), \[`src/app/app/session/\[kode]/page.tsx`](file:///e:/File/Project/RuangFoto/src/app/app/session/%5Bkode%5D/page.tsx), \[`src/lib/canvas-composer.ts`](file:///e:/File/Project/RuangFoto/src/lib/canvas-composer.ts)

\- \*\*Perubahan Surgical:\*\*

&#x20; 1. Pada \[`updateSessionByCode`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts#L784-L789), tambahkan `.finally(() => { if (queues.get(normalized) === task) queues.delete(normalized); })` agar `Map` antrean tidak bocor di memori.

&#x20; 2. Pada \[`storePosePhoto`](file:///e:/File/Project/RuangFoto/src/lib/server-store.ts#L740), gunakan `sessions/${sessionId}/pose-${poseNumber}-${role}` (memakai `sessionId` acak, bukan `sessionCode` 6 karakter) agar URL file tidak dapat ditebak dari luar.

&#x20; 3. Pada \[`session/\[kode]/page.tsx`](file:///e:/File/Project/RuangFoto/src/app/app/session/%5Bkode%5D/page.tsx), tambahkan \*in-flight guard\* pada `fetchSessionState` dan `pollSignals`, batasi ukuran `processedSignalIdsRef` maksimal 200 ID, serta naikkan interval polling sinyal menjadi `2500ms` ketika `peerState === 'terhubung'`.

&#x20; 4. Pada \[`canvas-composer.ts`](file:///e:/File/Project/RuangFoto/src/lib/canvas-composer.ts), muat seluruh gambar pose secara paralel menggunakan `Promise.all`.

\- \*\*Verify:\*\*

&#x20; - `queues.size` kembali ke `0` setelah seluruh operasi update sesi selesai.

&#x20; - Waktu komposisi kanvas HD 1080p turun di bawah 1 detik dan `next build` / `tsc --noEmit` lulus tanpa error.



\---



Apakah kamu ingin saya langsung menerapkan \*surgical fixes\* di atas dan menyimpan berkas `Evaluasi.md` ini ke direktori proyek? (Jika ya, silakan aktifkan mode \*\*Agent / Write\*\* lalu beri tahu saya).

