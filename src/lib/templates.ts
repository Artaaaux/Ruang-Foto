import { FrameOverlay, PhotoboothTemplate } from './types';

/**
 * Slot Host (kiri) & Guest (kanan) untuk bingkai PNG berdampingan.
 * Koordinat = area transparan PNG yang diperlebar 3px agar tertutup garis bingkai.
 */
function sideBySideSlots(
  rowsY: number[],
  leftX: number,
  rightX: number,
  w: number,
  h: number
): FrameOverlay['slots'] {
  return rowsY.map((y) => ({
    host: { x: leftX, y, w, h },
    guest: { x: rightX, y, w, h },
  }));
}

/**
 * 3 Template gratis saat peluncuran sesuai PRD Bagian 7.3 B & 17:
 * Semua warna wajib berasal dari token bagian 2 DesignRuangFoto.md.
 */
export const INITIAL_TEMPLATES: PhotoboothTemplate[] = [
  {
    id: 'retro-klasik',
    name: 'Retro Klasik 90s',
    category: 'Retro',
    description: 'Strip putih klasik dengan aksen kuning retro dan 4 pose berdampingan.',
    poseCount: 4,
    stripBg: '#FFFFFF',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'yellow',
    footerTagline: 'Sejak hari ini · RuangFoto',
    stickerText: '4 Pose',
  },
  {
    id: 'romantis-senja',
    name: 'Romantis Beda Kota',
    category: 'Romantis',
    description: 'Bingkai merah muda lembut untuk pasangan LDR dengan 3 pose hangat.',
    poseCount: 3,
    stripBg: '#FFC9C4',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'coral',
    footerTagline: 'Dekat di hati · RuangFoto',
    stickerText: '3 Pose',
  },
  {
    id: 'ceria-pop',
    name: 'Ceria Akhir Pekan',
    category: 'Ceria',
    description: 'Strip kuning cerah bergaya pop-brutalist dengan 4 pose seru bersama sahabat.',
    poseCount: 4,
    stripBg: '#FFE066',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'teal',
    footerTagline: 'Momen seru · RuangFoto',
    stickerText: '4 Pose',
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
    description: 'Bingkai kuning bertitik dengan label Kamera Host & Guest dan 4 pose berdampingan.',
    poseCount: 4,
    stripBg: '#FFE066',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'teal',
    footerTagline: 'Cekrek bareng! · RuangFoto',
    stickerText: '4 Pose',
    frame: {
      src: '/templates/frame-ceria-sunbeam.png',
      width: 1080,
      height: 2016,
      slots: sideBySideSlots([228, 604, 980, 1356], 78, 562, 441, 329),
    },
  },
  {
    id: 'frame-minimalis-cream',
    name: 'Minimalis Cream',
    category: 'Minimalis',
    description: 'Bingkai putih bersih dengan header krem dan 3 pose berdampingan.',
    poseCount: 3,
    stripBg: '#FFFFFF',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'yellow',
    footerTagline: 'Satu frekuensi · RuangFoto',
    stickerText: '3 Pose',
    frame: {
      src: '/templates/frame-minimalis-cream.png',
      width: 1080,
      height: 1640,
      slots: sideBySideSlots([228, 604, 980], 78, 562, 441, 329),
    },
  },
  {
    id: 'frame-retro-koral',
    name: 'Retro Koral',
    category: 'Retro',
    description: 'Bingkai krem bertitik dengan header ungu retro dan 3 pose berdampingan.',
    poseCount: 3,
    stripBg: '#FFF3EA',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'coral',
    footerTagline: 'Edisi terbatas hari ini · RuangFoto',
    stickerText: '3 Pose',
    frame: {
      src: '/templates/frame-retro-koral.png',
      width: 1080,
      height: 1640,
      slots: sideBySideSlots([228, 604, 980], 78, 562, 441, 329),
    },
  },
  {
    id: 'frame-romantis-blush',
    name: 'Romantis Blush',
    category: 'Romantis',
    description: 'Bingkai merah muda lembut untuk pasangan LDR dengan 3 pose berdampingan.',
    poseCount: 3,
    stripBg: '#FFC9C4',
    frameBorderColor: '#1A1A1A',
    badgeColor: 'coral',
    footerTagline: 'Jarak bukan penghalang · RuangFoto',
    stickerText: '3 Pose',
    frame: {
      src: '/templates/frame-romantis-blush.png',
      width: 1080,
      height: 1640,
      slots: sideBySideSlots([225, 601, 977], 75, 559, 446, 334),
    },
  },
  {
    id: 'frame-romantis-berdua',
    name: 'Romantis Berdua',
    category: 'Romantis',
    description: 'Satu bingkai lebar per pose, foto Host dan Guest bersebelahan dalam 1 frame.',
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
      // Slot lebar 904px dibelah dua dengan celah 6px di tengah (x 537–543)
      slots: [217, 741, 1265].map((y) => ({
        host: { x: 85, y, w: 452, h: 478 },
        guest: { x: 543, y, w: 452, h: 478 },
      })),
    },
  },
];

export function getTemplateById(id?: string | null): PhotoboothTemplate {
  return INITIAL_TEMPLATES.find((t) => t.id === id) || INITIAL_TEMPLATES[0];
}
