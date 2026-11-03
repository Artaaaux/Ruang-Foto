import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionByCode,
  storePosePhoto,
  updateSessionByCode,
} from '@/lib/server-store';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ kode: string }> }
) {
  const { kode } = await context.params;
  const session = await getSessionByCode(kode);
  if (!session) {
    return NextResponse.json(
      { error: 'Sesi tidak ditemukan atau sudah kedaluwarsa.' },
      { status: 404 }
    );
  }
  return NextResponse.json({ session, serverTime: Date.now() });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ kode: string }> }
) {
  const { kode } = await context.params;
  const body = await req.json();
  const { action } = body;

  const current = await getSessionByCode(kode);
  if (!current) {
    return NextResponse.json(
      { error: 'Sesi tidak ditemukan atau sudah berakhir.' },
      { status: 404 }
    );
  }

  // Batasi maksimal 2 peserta (PRD Bagian 10)
  if (action === 'join-guest') {
    const { guestId, guestName, guestAvatarColor } = body;
    if (
      current.guestId &&
      current.guestId !== guestId &&
      current.guestId !== 'simulated_partner' &&
      guestId !== 'simulated_partner'
    ) {
      return NextResponse.json(
        { error: 'Sesi ini sudah penuh (maksimal 2 peserta).' },
        { status: 403 }
      );
    }

    const updated = await updateSessionByCode(kode, (ses) => ({
      ...ses,
      guestId,
      guestName: guestName || 'Pasangan',
      guestAvatarColor: guestAvatarColor || '#A78BFA',
      status: ses.status === 'menunggu' ? 'berjalan' : ses.status,
    }));

    return NextResponse.json({ session: updated, serverTime: Date.now() });
  }

  if (action === 'toggle-media') {
    const { role, micOn, camOn } = body;
    const updated = await updateSessionByCode(kode, (ses) => {
      if (role === 'host') {
        return {
          ...ses,
          hostMicOn: typeof micOn === 'boolean' ? micOn : ses.hostMicOn,
          hostCamOn: typeof camOn === 'boolean' ? camOn : ses.hostCamOn,
        };
      }
      return {
        ...ses,
        guestMicOn: typeof micOn === 'boolean' ? micOn : ses.guestMicOn,
        guestCamOn: typeof camOn === 'boolean' ? camOn : ses.guestCamOn,
      };
    });
    return NextResponse.json({ session: updated, serverTime: Date.now() });
  }

  if (action === 'set-ready') {
    const { role, ready } = body;
    const updated = await updateSessionByCode(kode, (ses) => {
      const nextHostReady = role === 'host' ? Boolean(ready) : ses.hostReady;
      const nextGuestReady = role === 'guest' ? Boolean(ready) : ses.guestReady;
      const bothReady = nextHostReady && nextGuestReady;

      return {
        ...ses,
        hostReady: nextHostReady,
        guestReady: nextGuestReady,
        status: ses.status === 'menunggu' && ses.guestId ? 'berjalan' : ses.status,
        countdownStartedAt: bothReady
          ? ses.countdownStartedAt || Date.now() + 400
          : null,
      };
    });
    return NextResponse.json({ session: updated, serverTime: Date.now() });
  }

  if (action === 'upload-photo') {
    const { role, poseNumber, dataUrl } = body;
    const targetPoseNum = Number(poseNumber);
    const ownerId = role === 'host' ? current.hostId : current.guestId;

    // Unggah foto ke Supabase Storage `ruangfoto-media` + tabel `public.photos`
    const storedUrl = await storePosePhoto({
      sessionId: current.id,
      sessionCode: current.code,
      poseNumber: targetPoseNum,
      role: role === 'host' ? 'host' : 'guest',
      ownerId,
      dataUrl: String(dataUrl || ''),
    });

    const updated = await updateSessionByCode(kode, (ses) => {
      const nextPoses = ses.poses.map((p) => {
        if (p.poseNumber !== targetPoseNum) return p;
        return {
          ...p,
          hostDataUrl: role === 'host' ? storedUrl : p.hostDataUrl,
          guestDataUrl: role === 'guest' ? storedUrl : p.guestDataUrl,
          capturedAt: new Date().toISOString(),
        };
      });

      const currentPoseObj = nextPoses.find(
        (p) => p.poseNumber === ses.currentPose
      );
      const currentPoseDone = Boolean(
        currentPoseObj?.hostDataUrl && currentPoseObj?.guestDataUrl
      );

      let nextPoseNumber = ses.currentPose;
      if (currentPoseDone && ses.currentPose < nextPoses.length) {
        nextPoseNumber = ses.currentPose + 1;
      }

      return {
        ...ses,
        poses: nextPoses,
        currentPose: nextPoseNumber,
        hostReady: currentPoseDone ? false : ses.hostReady,
        guestReady: currentPoseDone ? false : ses.guestReady,
        countdownStartedAt: currentPoseDone ? null : ses.countdownStartedAt,
      };
    });
    return NextResponse.json({ session: updated, serverTime: Date.now() });
  }

  if (action === 'retake-pose') {
    const { poseNumber } = body;
    const targetPose = Number(poseNumber) || current.currentPose;
    const updated = await updateSessionByCode(kode, (ses) => ({
      ...ses,
      status: 'berjalan',
      currentPose: targetPose,
      hostReady: false,
      guestReady: false,
      countdownStartedAt: null,
      poses: ses.poses.map((p) =>
        p.poseNumber === targetPose
          ? { poseNumber: p.poseNumber }
          : p
      ),
    }));
    return NextResponse.json({ session: updated, serverTime: Date.now() });
  }

  if (action === 'retake-all') {
    const updated = await updateSessionByCode(kode, (ses) => ({
      ...ses,
      status: 'berjalan',
      currentPose: 1,
      hostReady: false,
      guestReady: false,
      countdownStartedAt: null,
      resultId: undefined,
      completedAt: undefined,
      poses: ses.poses.map((p) => ({ poseNumber: p.poseNumber })),
    }));
    return NextResponse.json({ session: updated, serverTime: Date.now() });
  }

  return NextResponse.json({ session: current, serverTime: Date.now() });
}
