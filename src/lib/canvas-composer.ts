import { PhotoboothTemplate, PosePhotoPair } from './types';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  stroke = true
) {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.clip();

  const imgRatio = img.width / img.height;
  const targetRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();

  if (!stroke) return;

  // Border 3px sesuai DesignRuangFoto.md 5.6
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#1A1A1A';
  ctx.stroke();
  ctx.restore();
}

function drawStarOnCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  fillColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.28, -size * 0.28);
  ctx.lineTo(size, 0);
  ctx.lineTo(size * 0.28, size * 0.28);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.28, size * 0.28);
  ctx.lineTo(-size, 0);
  ctx.lineTo(-size * 0.28, -size * 0.28);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#1A1A1A';
  ctx.stroke();
  ctx.restore();
}

/**
 * Mengambil foto beresolusi penuh dari elemen video lokal (FR-06)
 * atau membuat frame simulasi jika kamera tidak tersedia / mode simulasi.
 */
export function captureFrameFromVideo(
  videoEl: HTMLVideoElement | null,
  fallbackLabel: string,
  poseNumber: number,
  bgColor = '#FFE066'
): string {
  const canvas = document.createElement('canvas');
  const width =
    videoEl && videoEl.videoWidth > 0 ? videoEl.videoWidth : 1280;
  const height =
    videoEl && videoEl.videoHeight > 0 ? videoEl.videoHeight : 960;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (videoEl && videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
    // Mirror horizontal untuk kamera depan agar natural
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoEl, 0, 0, width, height);
    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.92);
  }

  // Fallback / Simulasi Pasangan di kanvas HD
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Pola titik halftone
  ctx.fillStyle = 'rgba(26, 26, 26, 0.10)';
  for (let x = 24; x < width; x += 36) {
    for (let y = 24; y < height; y += 36) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Ilustrasi geometris karakter kamera retro
  const cx = width / 2;
  const cy = height / 2 - 20;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, 140, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Mata & senyum bahagia
  ctx.fillStyle = '#1A1A1A';
  ctx.beginPath();
  ctx.arc(cx - 45, cy - 25, 14, 0, Math.PI * 2);
  ctx.arc(cx + 45, cy - 25, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.arc(cx, cy + 10, 55, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // Badge nama dan nomor pose
  drawRoundedRect(ctx, cx - 220, cy + 180, 440, 76, 24);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#1A1A1A';
  ctx.stroke();

  ctx.fillStyle = '#1A1A1A';
  ctx.font = 'bold 34px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${fallbackLabel} · Pose ${poseNumber}`, cx, cy + 218);

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Komposisi untuk template bingkai PNG: foto digambar ke tiap slot,
 * lalu PNG transparan ditumpuk di atasnya (DesignRuangFoto.md 5.6).
 */
async function composeWithFrame(params: {
  template: PhotoboothTemplate;
  poses: PosePhotoPair[];
  hostName: string;
  guestName: string;
  format: 'png' | 'jpeg';
}): Promise<string> {
  const { template, poses, hostName, guestName, format } = params;
  const frame = template.frame!;

  const canvas = document.createElement('canvas');
  canvas.width = frame.width;
  canvas.height = frame.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Isi latar dasar kanvas dengan warna strip agar area semi-transparan & sudut tetap bersih
  ctx.fillStyle = template.stripBg;
  ctx.fillRect(0, 0, frame.width, frame.height);

  // Muat seluruh foto pose + gambar bingkai PNG secara paralel (Promise.all)
  const slotTasks = frame.slots.map((slot, i) => {
    const posePair = poses[i] || { poseNumber: i + 1 };
    const hostSrc =
      posePair.hostDataUrl ||
      captureFrameFromVideo(null, hostName, i + 1, '#FFE066');
    const guestSrc =
      posePair.guestDataUrl ||
      captureFrameFromVideo(null, guestName, i + 1, '#A78BFA');
    return Promise.all([
      loadImage(hostSrc).catch(() => null),
      loadImage(guestSrc).catch(() => null),
    ]);
  });

  const [loadedSlots, frameImg] = await Promise.all([
    Promise.all(slotTasks),
    loadImage(frame.src),
  ]);

  for (let i = 0; i < frame.slots.length; i++) {
    const { host, guest } = frame.slots[i];
    const [hostImg, guestImg] = loadedSlots[i];

    // Latar di belakang slot agar celah antar-foto sesuai dengan warna template / divider
    const left = Math.min(host.x, guest.x);
    const top = Math.min(host.y, guest.y);
    ctx.fillStyle = frame.slotBg || template.stripBg;
    ctx.fillRect(
      left,
      top,
      Math.max(host.x + host.w, guest.x + guest.w) - left,
      Math.max(host.y + host.h, guest.y + guest.h) - top
    );

    const cells = [
      { rect: host, img: hostImg, bg: '#FFE066' },
      { rect: guest, img: guestImg, bg: '#A78BFA' },
    ];
    for (const cell of cells) {
      if (cell.img) {
        drawCoverImage(
          ctx,
          cell.img,
          cell.rect.x,
          cell.rect.y,
          cell.rect.w,
          cell.rect.h,
          0,
          false
        );
      } else {
        ctx.fillStyle = cell.bg;
        ctx.fillRect(cell.rect.x, cell.rect.y, cell.rect.w, cell.rect.h);
      }
    }
  }

  ctx.drawImage(frameImg, 0, 0, frame.width, frame.height);

  return format === 'jpeg'
    ? canvas.toDataURL('image/jpeg', 0.95)
    : canvas.toDataURL('image/png');
}

/**
 * Menggabungkan foto Host dan Guest ke dalam template photostrip kualitas HD (lebar 1080px)
 * di browser sesuai FR-08, FR-09, dan DesignRuangFoto.md 5.6.
 */
export async function composePhotostripHD(params: {
  template: PhotoboothTemplate;
  poses: PosePhotoPair[];
  hostName: string;
  guestName: string;
  format?: 'png' | 'jpeg';
}): Promise<string> {
  const {
    template,
    poses,
    hostName,
    guestName,
    format = 'png',
  } = params;

  if (template.frame) {
    return composeWithFrame({ template, poses, hostName, guestName, format });
  }

  const width = 1080; // Kualitas HD 1080p sesuai FR-09
  const padX = 56;
  const padTop = 64;
  const headerH = 110;
  const rowGap = 36;
  const colGap = 28;
  const cellW = (width - padX * 2 - colGap) / 2; // 470px per sisi
  const cellH = Math.round(cellW * 0.78); // 366px
  const footerH = 190;

  const poseCount = template.poseCount;
  const height =
    padTop + headerH + poseCount * cellH + (poseCount - 1) * rowGap + footerH;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Latar strip sesuai template
  ctx.fillStyle = template.stripBg;
  ctx.fillRect(0, 0, width, height);

  // Border luar strip 12px (#1A1A1A)
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#1A1A1A';
  ctx.strokeRect(8, 8, width - 16, height - 16);

  // Header strip: Nama template & pasangan
  ctx.fillStyle = '#1A1A1A';
  ctx.font = 'bold 38px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(template.name, padX, padTop);

  ctx.font = '500 26px "Space Grotesk", system-ui, sans-serif';
  ctx.fillStyle = '#4A4A4A';
  ctx.fillText(
    `${hostName} & ${guestName}`,
    padX,
    padTop + 50
  );

  // Bintang retro di kanan atas
  drawStarOnCanvas(ctx, width - padX - 28, padTop + 36, 26, '#FFE066');

  // Muat seluruh foto pose secara paralel (Promise.all)
  const loadedRows = await Promise.all(
    Array.from({ length: poseCount }, (_, i) => {
      const posePair = poses[i] || { poseNumber: i + 1 };
      const hostSrc =
        posePair.hostDataUrl ||
        captureFrameFromVideo(null, hostName, i + 1, '#FFE066');
      const guestSrc =
        posePair.guestDataUrl ||
        captureFrameFromVideo(null, guestName, i + 1, '#A78BFA');
      return Promise.all([
        loadImage(hostSrc).catch(() => null),
        loadImage(guestSrc).catch(() => null),
      ]);
    })
  );

  // Render setiap baris pose (Host di kiri, Guest di kanan)
  for (let i = 0; i < poseCount; i++) {
    const [hostImg, guestImg] = loadedRows[i];
    const rowY = padTop + headerH + i * (cellH + rowGap);
    const leftX = padX;
    const rightX = padX + cellW + colGap;

    // Host photo (kiri)
    if (hostImg) {
      drawCoverImage(ctx, hostImg, leftX, rowY, cellW, cellH, 20);
    } else {
      drawRoundedRect(ctx, leftX, rowY, cellW, cellH, 20);
      ctx.fillStyle = '#FFE066';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#1A1A1A';
      ctx.stroke();
    }

    // Guest photo (kanan)
    if (guestImg) {
      drawCoverImage(ctx, guestImg, rightX, rowY, cellW, cellH, 20);
    } else {
      drawRoundedRect(ctx, rightX, rowY, cellW, cellH, 20);
      ctx.fillStyle = '#A78BFA';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#1A1A1A';
      ctx.stroke();
    }
  }

  // Footer strip: bintang kecil dan teks "RuangFoto" sesuai DesignRuangFoto.md 5.6
  const footerY = height - footerH + 46;
  drawStarOnCanvas(ctx, padX + 22, footerY + 26, 22, '#FF5C5C');

  ctx.fillStyle = '#1A1A1A';
  ctx.font = 'bold 42px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('RuangFoto', padX + 60, footerY + 26);

  const dateLabel = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  ctx.font = 'bold 26px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(dateLabel, width - padX, footerY + 26);

  ctx.font = '500 22px "Space Grotesk", system-ui, sans-serif';
  ctx.fillStyle = '#4A4A4A';
  ctx.textAlign = 'left';
  ctx.fillText(template.footerTagline, padX + 60, footerY + 72);

  return format === 'jpeg'
    ? canvas.toDataURL('image/jpeg', 0.95)
    : canvas.toDataURL('image/png');
}
