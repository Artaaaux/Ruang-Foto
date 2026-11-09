import { PhotoboothTemplate } from './types';

/**
 * Koleksi template photostrip RuangFoto (Retro Neo-Brutalism).
 * Semua warna wajib berasal dari token bagian 2 DESIGN.md.
 */
export const INITIAL_TEMPLATES: PhotoboothTemplate[] = [
  {
    id: 'retro-klasik',
    name: 'Retro Klasik 90s',
    category: 'Retro',
    description:
      'Kolase zine arcade 90-an asimetris dengan layar monitor CRT, stiker komik, dan 4 pose zig-zag seru.',
    poseCount: 4,
    stripBg: '#FFF3EA',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'yellow',
    footerTagline: 'Sejak hari ini · RuangFoto',
    stickerText: '4 Pose',
    frame: {
      src: '/templates/frame-retro-klasik.png',
      width: 1080,
      height: 2140,
      slotBg: '#FFFFFF',
      slots: [
        {
          host: { x: 72, y: 228, w: 444, h: 312 },
          guest: { x: 570, y: 260, w: 434, h: 312 },
        },
        {
          host: { x: 68, y: 626, w: 412, h: 328 },
          guest: { x: 522, y: 648, w: 486, h: 328 },
        },
        {
          host: { x: 68, y: 1042, w: 486, h: 328 },
          guest: { x: 598, y: 1064, w: 412, h: 328 },
        },
        {
          host: { x: 68, y: 1462, w: 410, h: 324 },
          guest: { x: 550, y: 1446, w: 410, h: 324 },
        },
      ],
    },
  },
  {
    id: 'romantis-senja',
    name: 'Romantis Beda Kota',
    category: 'Romantis',
    description:
      'Jendela kubah romantis, polaroid miring, dan panggung gandeng menyala untuk pasangan LDR 3 pose.',
    poseCount: 3,
    stripBg: '#FFC9C4',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'coral',
    footerTagline: 'Dekat di hati · RuangFoto',
    stickerText: '3 Pose',
    frame: {
      src: '/templates/frame-romantis-senja.png',
      width: 1080,
      height: 1920,
      slotBg: '#FFFFFF',
      slots: [
        {
          host: { x: 72, y: 234, w: 432, h: 372 },
          guest: { x: 555, y: 258, w: 440, h: 320 },
        },
        {
          host: { x: 74, y: 702, w: 460, h: 372 },
          guest: { x: 546, y: 702, w: 460, h: 372 },
        },
        {
          host: { x: 85, y: 1166, w: 440, h: 320 },
          guest: { x: 576, y: 1152, w: 432, h: 372 },
        },
      ],
    },
  },
  {
    id: 'ceria-pop',
    name: 'Ceria Akhir Pekan',
    category: 'Ceria',
    description:
      'Panel komik pop-art heboh dengan polaroid miring, balon teriakan absurd, dan 4 pose penuh warna.',
    poseCount: 4,
    stripBg: '#FFE066',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'teal',
    footerTagline: 'Momen seru · RuangFoto',
    stickerText: '4 Pose',
    frame: {
      src: '/templates/frame-ceria-pop.png',
      width: 1080,
      height: 2160,
      slotBg: '#FFFFFF',
      slots: [
        {
          host: { x: 68, y: 228, w: 488, h: 332 },
          guest: { x: 598, y: 218, w: 410, h: 352 },
        },
        {
          host: { x: 68, y: 638, w: 410, h: 352 },
          guest: { x: 522, y: 648, w: 488, h: 332 },
        },
        {
          host: { x: 81, y: 1069, w: 437, h: 317 },
          guest: { x: 563, y: 1099, w: 437, h: 317 },
        },
        {
          host: { x: 68, y: 1482, w: 454, h: 334 },
          guest: { x: 558, y: 1482, w: 454, h: 334 },
        },
      ],
    },
  },
  // Template bingkai PNG (public/templates)
  {
    id: 'frame-ceria-kawaii',
    name: 'Ceria Super Cute',
    category: 'Ceria',
    description:
      'Strip biru pastel dengan ilustrasi karakter hewan menggemaskan dan 4 pose berdampingan.',
    poseCount: 4,
    stripBg: '#FFFFFF',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'teal',
    footerTagline: 'Super cute · RuangFoto',
    stickerText: '4 Pose',
    frame: {
      src: '/templates/frame-ceria-kawaii.png',
      width: 1080,
      height: 1622,
      slotBg: '#FFFFFF',
      slots: [
        {
          host: { x: 95, y: 172, w: 340, h: 224 },
          guest: { x: 637, y: 172, w: 340, h: 224 },
        },
        {
          host: { x: 95, y: 478, w: 340, h: 216 },
          guest: { x: 637, y: 478, w: 340, h: 216 },
        },
        {
          host: { x: 99, y: 775, w: 332, h: 214 },
          guest: { x: 640, y: 775, w: 332, h: 214 },
        },
        {
          host: { x: 95, y: 1052, w: 340, h: 224 },
          guest: { x: 637, y: 1052, w: 340, h: 224 },
        },
      ],
    },
  },
  {
    id: 'frame-minimalis-momen',
    name: 'Minimalis Momen Jauh',
    category: 'Minimalis',
    description:
      'Bingkai putih minimalis dengan aksen titik keemasan dan sapuan kuas artistik 3 pose.',
    poseCount: 3,
    stripBg: '#FFFFFF',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'yellow',
    footerTagline: 'Abadikan momen jarak jauh · RuangFoto',
    stickerText: '3 Pose',
    frame: {
      src: '/templates/frame-minimalis-momen.png',
      width: 1080,
      height: 2160,
      slotBg: '#FFFFFF',
      slots: [70, 742, 1430].map((y) => ({
        host: { x: 95, y, w: 442, h: 604 },
        guest: { x: 543, y, w: 442, h: 604 },
      })),
    },
  },
  {
    id: 'frame-ceria-sunbeam',
    name: 'Ceria Sunbeam',
    category: 'Ceria',
    description:
      'Ledakan sinar matahari disko dengan bunga daisy, frame asimetris zig-zag, dan kubah kembar 4 pose.',
    poseCount: 4,
    stripBg: '#FFE066',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'teal',
    footerTagline: 'Cekrek bareng! · RuangFoto',
    stickerText: '4 Pose',
    frame: {
      src: '/templates/frame-ceria-sunbeam.png',
      width: 1080,
      height: 2120,
      slotBg: '#FFFFFF',
      slots: [
        {
          host: { x: 68, y: 226, w: 446, h: 326 },
          guest: { x: 566, y: 258, w: 446, h: 326 },
        },
        {
          host: { x: 68, y: 632, w: 486, h: 334 },
          guest: { x: 594, y: 650, w: 418, h: 316 },
        },
        {
          host: { x: 68, y: 1044, w: 418, h: 316 },
          guest: { x: 526, y: 1026, w: 486, h: 334 },
        },
        {
          host: { x: 72, y: 1448, w: 458, h: 344 },
          guest: { x: 550, y: 1448, w: 458, h: 344 },
        },
      ],
    },
  },
  {
    id: 'frame-minimalis-cream',
    name: 'Minimalis Cream',
    category: 'Minimalis',
    description:
      'Jurnal kliping polaroid miring dengan selotip warna-warni, penjepit kertas, dan stiker coretan 3 pose.',
    poseCount: 3,
    stripBg: '#FFF3EA',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'yellow',
    footerTagline: 'Satu frekuensi · RuangFoto',
    stickerText: '3 Pose',
    frame: {
      src: '/templates/frame-minimalis-cream.png',
      width: 1080,
      height: 1880,
      slotBg: '#FFFFFF',
      slots: [
        {
          host: { x: 83, y: 241, w: 423, h: 333 },
          guest: { x: 565, y: 277, w: 433, h: 333 },
        },
        {
          host: { x: 83, y: 712, w: 443, h: 334 },
          guest: { x: 577, y: 683, w: 420, h: 333 },
        },
        {
          host: { x: 82, y: 1158, w: 434, h: 334 },
          guest: { x: 565, y: 1177, w: 433, h: 333 },
        },
      ],
    },
  },
  {
    id: 'frame-retro-koral',
    name: 'Retro Koral',
    category: 'Retro',
    description:
      'Siaran TV tabung retro 90-an dengan antena kelinci, polaroid miring, dan stiker neon 3 pose.',
    poseCount: 3,
    stripBg: '#FFF3EA',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'coral',
    footerTagline: 'Edisi terbatas hari ini · RuangFoto',
    stickerText: '3 Pose',
    frame: {
      src: '/templates/frame-retro-koral.png',
      width: 1080,
      height: 1880,
      slotBg: '#FFFFFF',
      slots: [
        {
          host: { x: 62, y: 228, w: 456, h: 356 },
          guest: { x: 588, y: 258, w: 420, h: 328 },
        },
        {
          host: { x: 68, y: 684, w: 420, h: 328 },
          guest: { x: 518, y: 662, w: 452, h: 356 },
        },
        {
          host: { x: 76, y: 1131, w: 436, h: 335 },
          guest: { x: 568, y: 1151, w: 436, h: 335 },
        },
      ],
    },
  },
  {
    id: 'frame-romantis-blush',
    name: 'Romantis Blush',
    category: 'Romantis',
    description:
      'Kubah jendela kembar romantis dan bento zig-zag bertabur surat cinta serta stiker bucin 3 pose.',
    poseCount: 3,
    stripBg: '#FFC9C4',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'coral',
    footerTagline: 'Jarak bukan penghalang · RuangFoto',
    stickerText: '3 Pose',
    frame: {
      src: '/templates/frame-romantis-blush.png',
      width: 1080,
      height: 1880,
      slotBg: '#FFFFFF',
      slots: [
        {
          host: { x: 72, y: 234, w: 442, h: 360 },
          guest: { x: 566, y: 266, w: 442, h: 360 },
        },
        {
          host: { x: 72, y: 680, w: 486, h: 352 },
          guest: { x: 596, y: 700, w: 412, h: 332 },
        },
        {
          host: { x: 72, y: 1128, w: 412, h: 332 },
          guest: { x: 522, y: 1108, w: 486, h: 352 },
        },
      ],
    },
  },
  {
    id: 'frame-romantis-berdua',
    name: 'Romantis Berdua',
    category: 'Romantis',
    description:
      'Panggung sinema gandeng zig-zag dan jendela kubah kembar tanpa sekat, bikin LDR serasa sebelahan.',
    poseCount: 3,
    stripBg: '#FFC9C4',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'purple',
    footerTagline: 'Jarak cuma angka, kangennya nyata · RuangFoto',
    stickerText: '3 Pose',
    frame: {
      src: '/templates/frame-romantis-berdua.png',
      width: 1080,
      height: 2160,
      slotBg: '#1A1A1A',
      slots: [
        {
          host: { x: 66, y: 238, w: 432, h: 436 },
          guest: { x: 498, y: 238, w: 432, h: 436 },
        },
        {
          host: { x: 150, y: 770, w: 432, h: 436 },
          guest: { x: 582, y: 770, w: 432, h: 436 },
        },
        {
          host: { x: 80, y: 1302, w: 460, h: 448 },
          guest: { x: 540, y: 1302, w: 460, h: 448 },
        },
      ],
    },
  },
  // 5 Template Baru (Retro Neo-Brutalism Lively & Absurd)
  {
    id: 'frame-retro-windows',
    name: 'Retro OS 98 Bucin',
    category: 'Retro',
    description:
      'Tumpukan jendela pop-up komputer tahun 98 dengan pesan error bucin menggemaskan dan 4 pose zig-zag.',
    poseCount: 4,
    stripBg: '#36CFC0',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'purple',
    footerTagline: 'Koneksi hati 100% · RuangFoto',
    stickerText: '4 Pose',
    frame: {
      src: '/templates/frame-retro-windows.png',
      width: 1080,
      height: 2140,
      slotBg: '#FFFFFF',
      slots: [
        {
          host: { x: 68, y: 262, w: 450, h: 312 },
          guest: { x: 558, y: 290, w: 454, h: 312 },
        },
        {
          host: { x: 68, y: 688, w: 486, h: 312 },
          guest: { x: 586, y: 668, w: 426, h: 312 },
        },
        {
          host: { x: 68, y: 1096, w: 426, h: 312 },
          guest: { x: 526, y: 1116, w: 486, h: 312 },
        },
        {
          host: { x: 68, y: 1516, w: 452, h: 308 },
          guest: { x: 560, y: 1500, w: 452, h: 308 },
        },
      ],
    },
  },
  {
    id: 'frame-ceria-absurd',
    name: 'Ceria Sirkus Absurd',
    category: 'Ceria',
    description:
      'Panggung karnaval heboh dengan papan catur disko, mahkota raja-ratu, kubah sirkus, dan 4 pose kocak.',
    poseCount: 4,
    stripBg: '#FFE066',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'coral',
    footerTagline: 'Ketawa bareng · RuangFoto',
    stickerText: '4 Pose',
    frame: {
      src: '/templates/frame-ceria-absurd.png',
      width: 1080,
      height: 2140,
      slotBg: '#FFFFFF',
      slots: [
        {
          host: { x: 73, y: 233, w: 470, h: 321 },
          guest: { x: 593, y: 259, w: 415, h: 307 },
        },
        {
          host: { x: 73, y: 649, w: 415, h: 307 },
          guest: { x: 537, y: 635, w: 470, h: 321 },
        },
        {
          host: { x: 72, y: 1046, w: 442, h: 342 },
          guest: { x: 566, y: 1074, w: 442, h: 342 },
        },
        {
          host: { x: 72, y: 1474, w: 446, h: 330 },
          guest: { x: 562, y: 1474, w: 446, h: 330 },
        },
      ],
    },
  },
  {
    id: 'frame-romantis-galaksi',
    name: 'Romantis Kosmik Melayang',
    category: 'Romantis',
    description:
      'Orbit galaksi ungu menyala dengan jendela kubah astronot, kapsul luar angkasa gandeng, dan 3 pose bucin.',
    poseCount: 3,
    stripBg: '#A78BFA',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'coral',
    footerTagline: 'Sayang sampai ke bulan · RuangFoto',
    stickerText: '3 Pose',
    frame: {
      src: '/templates/frame-romantis-galaksi.png',
      width: 1080,
      height: 1900,
      slotBg: '#FFFFFF',
      slots: [
        {
          host: { x: 72, y: 236, w: 438, h: 366 },
          guest: { x: 561, y: 265, w: 443, h: 329 },
        },
        {
          host: { x: 74, y: 702, w: 460, h: 364 },
          guest: { x: 546, y: 702, w: 460, h: 364 },
        },
        {
          host: { x: 77, y: 1167, w: 443, h: 329 },
          guest: { x: 570, y: 1144, w: 438, h: 366 },
        },
      ],
    },
  },
  {
    id: 'frame-retro-kaset',
    name: 'Retro Kaset Mixtape',
    category: 'Retro',
    description:
      'Kaset mixtape 90-an dengan pita gulungan berputar, panggung musik kembar, dan stiker lagu cinta 3 pose.',
    poseCount: 3,
    stripBg: '#FFF3EA',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'yellow',
    footerTagline: 'Lagu kita berdua · RuangFoto',
    stickerText: '3 Pose',
    frame: {
      src: '/templates/frame-retro-kaset.png',
      width: 1080,
      height: 1900,
      slotBg: '#FFFFFF',
      slots: [
        {
          host: { x: 68, y: 234, w: 482, h: 354 },
          guest: { x: 592, y: 254, w: 420, h: 332 },
        },
        {
          host: { x: 74, y: 700, w: 456, h: 352 },
          guest: { x: 550, y: 700, w: 456, h: 352 },
        },
        {
          host: { x: 68, y: 1152, w: 420, h: 332 },
          guest: { x: 530, y: 1132, w: 482, h: 354 },
        },
      ],
    },
  },
  {
    id: 'frame-minimalis-jurnal',
    name: 'Minimalis Jurnal Stiker',
    category: 'Minimalis',
    description:
      'Buku catatan grid 90-an dengan lubang binder, kliping polaroid miring, selotip warna-warni, dan 4 pose lucu.',
    poseCount: 4,
    stripBg: '#FFFFFF',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'teal',
    footerTagline: 'Catatan hari ini · RuangFoto',
    stickerText: '4 Pose',
    frame: {
      src: '/templates/frame-minimalis-jurnal.png',
      width: 1080,
      height: 2140,
      slotBg: '#FFFFFF',
      slots: [
        {
          host: { x: 81, y: 233, w: 429, h: 316 },
          guest: { x: 563, y: 261, w: 443, h: 317 },
        },
        {
          host: { x: 74, y: 638, w: 482, h: 330 },
          guest: { x: 596, y: 652, w: 414, h: 316 },
        },
        {
          host: { x: 74, y: 1046, w: 414, h: 316 },
          guest: { x: 528, y: 1032, w: 482, h: 330 },
        },
        {
          host: { x: 80, y: 1461, w: 436, h: 317 },
          guest: { x: 564, y: 1445, w: 436, h: 317 },
        },
      ],
    },
  },
];

export function getTemplateById(id?: string | null): PhotoboothTemplate {
  return INITIAL_TEMPLATES.find((t) => t.id === id) || INITIAL_TEMPLATES[0];
}
