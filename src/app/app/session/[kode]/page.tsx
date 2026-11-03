'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  Clock,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getTemplateById } from '@/lib/templates';
import {
  getIceServers,
  getSupabaseClient,
  isSupabaseConfigured,
} from '@/lib/supabase';
import { captureFrameFromVideo } from '@/lib/canvas-composer';
import { PhotoboothSession, WebRTCSignalMessage } from '@/lib/types';
import {
  RfAvatarStack,
  RfBadge,
  RfButton,
  RfCard,
} from '@/components/ui/NeoPrimitives';
import {
  ConnectionState,
  CountdownOverlay,
  InviteLinkBox,
  PoseIndicator,
  SessionControlBar,
  VideoTile,
} from '@/components/ruangfoto/DomainComponents';

export default function SessionRoomPage() {
  const params = useParams<{ kode: string }>();
  const kode = (params?.kode || '').toUpperCase();
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [session, setSession] = useState<PhotoboothSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [cameraError, setCameraError] = useState('');

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [localMediaReady, setLocalMediaReady] = useState(false);
  const [peerState, setPeerState] = useState<ConnectionState>('menyambung');

  const [countdownStep, setCountdownStep] = useState<
    3 | 2 | 1 | 'cekrek' | null
  >(null);
  const [showFlash, setShowFlash] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadTimeoutWarning, setUploadTimeoutWarning] = useState(false);
  const [remainingSessionSec, setRemainingSessionSec] = useState<number>(900);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const processedSignalIdsRef = useRef<Set<string>>(new Set());
  const bcRef = useRef<BroadcastChannel | null>(null);
  const rtChannelRef = useRef<RealtimeChannel | null>(null);
  const lastSignalTimeRef = useRef<number>(0);
  const activeCountdownIdRef = useRef<number | null>(null);
  const countdownTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearCountdownTimers = useCallback(() => {
    countdownTimersRef.current.forEach((t) => clearTimeout(t));
    countdownTimersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearCountdownTimers();
    };
  }, [clearCountdownTimers]);

  // 1. Wajib login: arahkan ke /login dengan parameter redirect kembali ke sesi ini (PRD 7.2)
  useEffect(() => {
    if (!authLoading && !user && kode) {
      router.replace(`/login?redirect=/app/session/${kode}`);
    }
  }, [authLoading, user, kode, router]);

  // 2. Minta izin kamera & mikrofon saat masuk ruang sesi (PRD 10)
  const initLocalMedia = useCallback(async () => {
    setCameraError('');
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError(
        'Kamera belum diizinkan. Buka pengaturan browser, izinkan kamera, lalu muat ulang halaman.'
      );
      setLocalMediaReady(true);
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 960 },
            facingMode: 'user',
          },
          audio: true,
        });
      } catch {
        // Fallback jika mikrofon terkunci atau resolusi ideal ditolak oleh browser kedua
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError(
        'Kamera belum diizinkan. Buka pengaturan browser, izinkan kamera, lalu muat ulang halaman.'
      );
    } finally {
      setLocalMediaReady(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    initLocalMedia();
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [user, initLocalMedia]);

  // Pastikan localVideoRef & remoteVideoRef selalu terhubung ke stream saat tile dirender ulang
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current && camOn) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    }
  }, [camOn, session, peerState]);

  // 3. Ambil & sinkronkan data sesi dari server
  const fetchSessionState = useCallback(async () => {
    if (!kode || !user) return;
    try {
      const res = await fetch(`/api/sessions/${kode}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.session) {
        setSessionError(
          data.error || 'Sesi tidak ditemukan atau sudah berakhir.'
        );
        setLoadingSession(false);
        return;
      }

      const loaded: PhotoboothSession = data.session;

      // Jika pengguna bukan host dan slot guest masih kosong, daftarkan sebagai guest otomatis
      if (loaded.hostId !== user.id && !loaded.guestId) {
        const joinRes = await fetch(`/api/sessions/${kode}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'join-guest',
            guestId: user.id,
            guestName: user.name,
            guestAvatarColor: user.avatarColor,
          }),
        });
        const joinData = await joinRes.json();
        if (joinRes.ok && joinData.session) {
          setSession(joinData.session);
          setLoadingSession(false);
          return;
        } else if (!joinRes.ok) {
          setSessionError(
            joinData.error || 'Sesi ini sudah penuh (maksimal 2 peserta).'
          );
          setLoadingSession(false);
          return;
        }
      }

      setSession(loaded);
      setLoadingSession(false);
    } catch {
      setLoadingSession(false);
    }
  }, [kode, user]);

  useEffect(() => {
    fetchSessionState();
    const poll = setInterval(fetchSessionState, 1200);
    return () => clearInterval(poll);
  }, [fetchSessionState]);

  // 4. WebRTC Peer-to-Peer Signaling (Supabase Realtime + BroadcastChannel + API Signal)
  const sendSignal = useCallback(
    async (
      type: WebRTCSignalMessage['type'],
      payload: Record<string, unknown>,
      role: 'host' | 'guest'
    ) => {
      if (!user || !kode) return;
      const sigId = `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      processedSignalIdsRef.current.add(sigId);
      const msg = {
        id: sigId,
        sessionCode: kode,
        senderId: user.id,
        senderRole: role,
        type,
        payload,
      };
      const broadcastPayload = {
        ...msg,
        createdAt: Date.now(),
      };
      if (bcRef.current) {
        try {
          bcRef.current.postMessage(broadcastPayload);
        } catch {
          // Ignore BroadcastChannel serialization error
        }
      }
      if (rtChannelRef.current) {
        rtChannelRef.current
          .send({
            type: 'broadcast',
            event: 'signal',
            payload: broadcastPayload,
          })
          .catch(() => {});
      }
      try {
        await fetch(`/api/sessions/${kode}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        });
      } catch {
        // Ignore network hiccup
      }
    },
    [kode, user]
  );

  const flushPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    if (!pc.remoteDescription || pendingCandidatesRef.current.length === 0) {
      return;
    }
    const queue = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];
    for (const cand of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch {
        // Ignore stale candidate
      }
    }
  }, []);

  const ensurePeerConnection = useCallback(
    (role: 'host' | 'guest', forceRecreate = false) => {
      if (forceRecreate && pcRef.current) {
        try {
          pcRef.current.close();
        } catch {
          // Ignore close error
        }
        pcRef.current = null;
        pendingCandidatesRef.current = [];
      }

      if (pcRef.current) return pcRef.current;

      const pc = new RTCPeerConnection({
        iceServers: getIceServers(),
      });

      const localStream = localStreamRef.current;
      if (localStream && localStream.getTracks().length > 0) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      } else {
        try {
          pc.addTransceiver('video', { direction: 'recvonly' });
          pc.addTransceiver('audio', { direction: 'recvonly' });
        } catch {
          // Ignore transceiver error
        }
      }

      pc.ontrack = (event) => {
        let stream = event.streams?.[0];
        if (!stream) {
          stream = remoteStreamRef.current || new MediaStream();
          stream.addTrack(event.track);
        }
        remoteStreamRef.current = stream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setPeerState('terhubung');
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(
            'ice-candidate',
            { candidate: event.candidate.toJSON() },
            role
          );
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setPeerState('terhubung');
        } else if (pc.connectionState === 'failed') {
          setPeerState('terputus');
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (
          pc.iceConnectionState === 'connected' ||
          pc.iceConnectionState === 'completed'
        ) {
          setPeerState('terhubung');
        } else if (pc.iceConnectionState === 'failed') {
          setPeerState('terputus');
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [sendSignal]
  );

  const startWebRTCOffer = useCallback(async () => {
    const pc = ensurePeerConnection('host', true);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (pc.localDescription) {
        await sendSignal(
          'offer',
          {
            sdp: {
              type: pc.localDescription.type,
              sdp: pc.localDescription.sdp,
            },
          },
          'host'
        );
      }
    } catch {
      // Ignore transient offer error
    }
  }, [ensurePeerConnection, sendSignal]);

  const handleIncomingSignal = useCallback(
    async (msg: WebRTCSignalMessage, myRole: 'host' | 'guest') => {
      if (!user || msg.senderId === user.id) return;
      if (msg.id) {
        if (processedSignalIdsRef.current.has(msg.id)) return;
        processedSignalIdsRef.current.add(msg.id);
      }

      if (msg.type === 'state-sync') {
        setPeerState('terhubung');
        fetchSessionState();
        return;
      }

      if (msg.type === 'peer-ready') {
        setPeerState('terhubung');
        fetchSessionState();
        if (myRole === 'host') {
          await startWebRTCOffer();
        }
        return;
      }

      try {
        if (msg.type === 'offer' && msg.payload.sdp) {
          const pc = ensurePeerConnection(myRole, true);
          await pc.setRemoteDescription(
            new RTCSessionDescription(
              msg.payload.sdp as RTCSessionDescriptionInit
            )
          );
          await flushPendingCandidates(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          if (pc.localDescription) {
            await sendSignal(
              'answer',
              {
                sdp: {
                  type: pc.localDescription.type,
                  sdp: pc.localDescription.sdp,
                },
              },
              myRole
            );
          }
          setPeerState('terhubung');
        } else if (msg.type === 'answer' && msg.payload.sdp) {
          const pc = ensurePeerConnection(myRole, false);
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(
              new RTCSessionDescription(
                msg.payload.sdp as RTCSessionDescriptionInit
              )
            );
            await flushPendingCandidates(pc);
            setPeerState('terhubung');
          }
        } else if (msg.type === 'ice-candidate' && msg.payload.candidate) {
          const cand = msg.payload.candidate as RTCIceCandidateInit;
          const pc = pcRef.current;
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } else {
            pendingCandidatesRef.current.push(cand);
          }
        }
      } catch {
        // Ignore transient WebRTC negotiation race
      }
    },
    [
      user,
      ensurePeerConnection,
      flushPendingCandidates,
      sendSignal,
      fetchSessionState,
      startWebRTCOffer,
    ]
  );

  const sessionRole: 'host' | 'guest' | null =
    session && user ? (session.hostId === user.id ? 'host' : 'guest') : null;
  const sessionGuestId = session?.guestId || null;

  useEffect(() => {
    if (!user || !kode || !sessionRole) return;

    if (sessionGuestId === 'simulated_partner') {
      setPeerState('terhubung');
      return;
    }

    if (sessionGuestId) {
      setPeerState('terhubung');
    }

    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(`rf_session_${kode}`);
      bc.onmessage = (ev) => {
        if (ev.data) {
          handleIncomingSignal(ev.data as WebRTCSignalMessage, sessionRole);
        }
      };
      bcRef.current = bc;
    }

    const supabase = getSupabaseClient();
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel(`rf_session_${kode}`, {
          config: { broadcast: { self: false } },
        })
        .on('broadcast', { event: 'signal' }, ({ payload }) => {
          if (payload) {
            handleIncomingSignal(payload as WebRTCSignalMessage, sessionRole);
          }
        })
        .subscribe();
      rtChannelRef.current = channel;
    }

    if (
      localMediaReady &&
      sessionGuestId &&
      sessionGuestId !== 'simulated_partner'
    ) {
      if (sessionRole === 'host') {
        startWebRTCOffer();
      } else {
        sendSignal('peer-ready', {}, 'guest');
      }
    }

    const pollSignals = async () => {
      try {
        const res = await fetch(
          `/api/sessions/${kode}/signal?since=${lastSignalTimeRef.current}&exclude=${user.id}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (res.ok && Array.isArray(data.signals)) {
          for (const sig of data.signals as WebRTCSignalMessage[]) {
            if (sig.createdAt > lastSignalTimeRef.current) {
              lastSignalTimeRef.current = sig.createdAt;
            }
            await handleIncomingSignal(sig, sessionRole);
          }
        }
      } catch {
        // Ignore polling hiccup
      }
    };

    pollSignals();
    const signalInterval = setInterval(pollSignals, 800);

    return () => {
      clearInterval(signalInterval);
      if (bcRef.current) {
        bcRef.current.close();
        bcRef.current = null;
      }
      if (rtChannelRef.current && supabase) {
        supabase.removeChannel(rtChannelRef.current);
        rtChannelRef.current = null;
      }
    };
  }, [
    user,
    kode,
    sessionRole,
    sessionGuestId,
    localMediaReady,
    handleIncomingSignal,
    sendSignal,
    startWebRTCOffer,
  ]);

  // 5. Batas durasi sesi 15 menit (NFR-03)
  useEffect(() => {
    if (!session?.expiresAt) return;
    const tick = () => {
      const diffSec = Math.max(
        0,
        Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)
      );
      setRemainingSessionSec(diffSec);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session?.expiresAt]);

  // 6. Navigasi otomatis ke layar hasil begitu semua pose selesai dan resultId tersedia
  useEffect(() => {
    if (session?.status === 'selesai' && session.resultId) {
      router.push(`/app/result/${session.resultId}`);
    }
  }, [session?.status, session?.resultId, router]);

  // 7. Eksekusi Countdown Tersinkron 3 - 2 - 1 - Cekrek! & Ambil Foto Kamera Lokal (FR-06)
  const captureAndUploadPose = useCallback(
    async (poseNum: number, myRole: 'host' | 'guest', isSimulated: boolean) => {
      if (!session || !user) return;
      setUploadingPhoto(true);
      setUploadTimeoutWarning(false);

      try {
        const myPhotoDataUrl = captureFrameFromVideo(
          camOn && !cameraError ? localVideoRef.current : null,
          user.name.split(' ')[0],
          poseNum,
          user.avatarColor
        );

        await fetch(`/api/sessions/${kode}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'upload-photo',
            role: myRole,
            poseNumber: poseNum,
            dataUrl: myPhotoDataUrl,
          }),
        });

        // Jika dalam mode Simulasi Pasangan, unggah juga foto pasangan secara serempak
        if (isSimulated) {
          const partnerPhotoDataUrl = captureFrameFromVideo(
            null,
            session.guestName || 'Pasangan',
            poseNum,
            '#A78BFA'
          );
          await fetch(`/api/sessions/${kode}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'upload-photo',
              role: 'guest',
              poseNumber: poseNum,
              dataUrl: partnerPhotoDataUrl,
            }),
          });
        }

        await sendSignal('state-sync', { poseNum }, myRole);
        await fetchSessionState();
      } catch {
        showToast(
          'Gagal mengunggah foto pose ini. Kamu bisa mengulang pose.',
          'error'
        );
      } finally {
        setUploadingPhoto(false);
      }
    },
    [
      session,
      user,
      camOn,
      cameraError,
      kode,
      sendSignal,
      fetchSessionState,
      showToast,
    ]
  );

  const captureAndUploadPoseRef = useRef(captureAndUploadPose);
  useEffect(() => {
    captureAndUploadPoseRef.current = captureAndUploadPose;
  }, [captureAndUploadPose]);

  useEffect(() => {
    if (!session?.countdownStartedAt || !user) {
      if (!session?.countdownStartedAt) {
        activeCountdownIdRef.current = null;
      }
      return;
    }

    if (activeCountdownIdRef.current === session.countdownStartedAt) {
      return;
    }

    activeCountdownIdRef.current = session.countdownStartedAt;
    clearCountdownTimers();

    const poseToCapture = session.currentPose;
    const myRole: 'host' | 'guest' =
      session.hostId === user.id ? 'host' : 'guest';
    const isSimulated = session.guestId === 'simulated_partner';

    setCountdownStep(3);
    const t2 = setTimeout(() => setCountdownStep(2), 1000);
    const t1 = setTimeout(() => setCountdownStep(1), 2000);
    const t0 = setTimeout(() => {
      setCountdownStep('cekrek');
      setShowFlash(true);
      captureAndUploadPoseRef.current(poseToCapture, myRole, isSimulated);
    }, 3000);
    const tFlash = setTimeout(() => {
      setShowFlash(false);
    }, 3150);
    const tDone = setTimeout(() => {
      setCountdownStep(null);
    }, 3600);

    countdownTimersRef.current = [t2, t1, t0, tFlash, tDone];
  }, [
    session?.countdownStartedAt,
    session?.currentPose,
    session?.hostId,
    session?.guestId,
    user,
    clearCountdownTimers,
  ]);

  // Peringatan batas waktu 15 detik jika salah satu pihak belum mengunggah foto (PRD 7.3 A)
  useEffect(() => {
    if (!session) return;
    const poseObj = session.poses.find(
      (p) => p.poseNumber === session.currentPose
    );
    const onlyOneSideUploaded =
      (Boolean(poseObj?.hostDataUrl) && !poseObj?.guestDataUrl) ||
      (!poseObj?.hostDataUrl && Boolean(poseObj?.guestDataUrl));

    if (!onlyOneSideUploaded) {
      setUploadTimeoutWarning(false);
      return;
    }

    const timer = setTimeout(() => {
      setUploadTimeoutWarning(true);
    }, 15000);
    return () => clearTimeout(timer);
  }, [session]);

  if (authLoading || loadingSession || !user) {
    return (
      <div className="min-h-screen bg-rf-bg flex items-center justify-center font-bold text-rf-ink">
        Memproses…
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="min-h-screen bg-rf-bg flex items-center justify-center p-4">
        <RfCard color="white" className="max-w-md w-full flex flex-col gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-rf-coral border-3 border-rf-ink flex items-center justify-center">
            <AlertCircle size={24} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <h1 className="rf-h2 text-rf-ink">Sesi tidak tersedia</h1>
          <p className="rf-body text-rf-muted">
            {sessionError ||
              'Link sesi ini tidak ditemukan atau sudah melewati batas waktu 15 menit.'}
          </p>
          <RfButton
            type="button"
            variant="primary"
            onClick={() => router.push('/app')}
          >
            <span>Kembali ke halaman utama</span>
          </RfButton>
        </RfCard>
      </div>
    );
  }

  const myRole: 'host' | 'guest' =
    session.hostId === user.id ? 'host' : 'guest';
  const isHost = myRole === 'host';
  const template = getTemplateById(session.templateId);
  const partnerPresent = Boolean(session.guestId);
  const isSimulatedPartner = session.guestId === 'simulated_partner';
  const myReady = isHost ? session.hostReady : session.guestReady;
  const partnerReady = isHost ? session.guestReady : session.hostReady;
  const partnerName = isHost
    ? session.guestName || 'Pasangan'
    : session.hostName;
  const partnerAvatarColor = isHost
    ? session.guestAvatarColor || '#A78BFA'
    : session.hostAvatarColor || '#FFE066';
  const partnerMicOn = isHost ? session.guestMicOn : session.hostMicOn;
  const partnerCamOn = isHost ? session.guestCamOn : session.hostCamOn;

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/app/session/${session.code}`
      : `/app/session/${session.code}`;

  const handleToggleMic = async () => {
    const next = !micOn;
    setMicOn(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = next;
      });
    }
    await fetch(`/api/sessions/${kode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'toggle-media',
        role: myRole,
        micOn: next,
      }),
    });
    sendSignal('state-sync', {}, myRole);
  };

  const handleToggleCam = async () => {
    const next = !camOn;
    setCamOn(next);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = next;
      });
    }
    await fetch(`/api/sessions/${kode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'toggle-media',
        role: myRole,
        camOn: next,
      }),
    });
    sendSignal('state-sync', {}, myRole);
  };

  const handleToggleReady = async () => {
    if (!partnerPresent) {
      showToast('Tunggu pasanganmu masuk terlebih dahulu.', 'info');
      return;
    }

    const nextReady = !myReady;
    await fetch(`/api/sessions/${kode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set-ready',
        role: myRole,
        ready: nextReady,
      }),
    });

    // Jika pasangan adalah Simulasi, otomatis ikut siap agar countdown langsung mulai
    if (isSimulatedPartner && nextReady) {
      await fetch(`/api/sessions/${kode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set-ready',
          role: 'guest',
          ready: true,
        }),
      });
    }

    await sendSignal('state-sync', {}, myRole);
    await fetchSessionState();
  };

  const handleEnableSimulatedPartner = async () => {
    await fetch(`/api/sessions/${kode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'join-guest',
        guestId: 'simulated_partner',
        guestName: 'Raka (Simulasi)',
        guestAvatarColor: '#A78BFA',
      }),
    });
    showToast(
      'Pasangan simulasi bergabung! Tekan tombol Siap untuk memotret.',
      'success'
    );
    await fetchSessionState();
  };

  const handleRetakePose = async (poseNumber: number) => {
    clearCountdownTimers();
    setCountdownStep(null);
    setShowFlash(false);
    activeCountdownIdRef.current = null;
    await fetch(`/api/sessions/${kode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'retake-pose',
        poseNumber,
      }),
    });
    await sendSignal('state-sync', {}, myRole);
    showToast(`Mengulang pose ${poseNumber}`, 'info');
    await fetchSessionState();
  };

  const handleRetakeAll = async () => {
    clearCountdownTimers();
    setCountdownStep(null);
    setShowFlash(false);
    activeCountdownIdRef.current = null;
    await fetch(`/api/sessions/${kode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'retake-all',
      }),
    });
    await sendSignal('state-sync', {}, myRole);
    showToast('Mengulang seluruh pose dari awal', 'info');
    await fetchSessionState();
  };

  const minsLeft = String(Math.floor(remainingSessionSec / 60)).padStart(
    2,
    '0'
  );
  const secsLeft = String(remainingSessionSec % 60).padStart(2, '0');

  return (
    <div className="min-h-screen bg-rf-bg text-rf-ink flex flex-col justify-between pb-32 lg:pb-8">
      {/* Bilah Status Atas Ruang Sesi (DesignRuangFoto.md 6.4) */}
      <header className="w-full border-b-3 border-rf-ink bg-rf-bg sticky top-0 z-20">
        <div className="max-w-content mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <PoseIndicator
              currentPose={session.currentPose}
              totalPoses={template.poseCount}
              poses={session.poses}
            />
            <RfBadge color="yellow">{template.name}</RfBadge>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-rf-white border-2 border-rf-ink rounded-full px-3 py-1 text-[13px] font-bold text-rf-ink tabular-nums">
              <Clock size={15} strokeWidth={2.5} aria-hidden="true" />
              <span>
                {minsLeft}:{secsLeft}
              </span>
            </span>

            <RfAvatarStack
              users={
                partnerPresent
                  ? [
                      {
                        name: session.hostName,
                        color: session.hostAvatarColor,
                      },
                      {
                        name: session.guestName || 'Pasangan',
                        color: session.guestAvatarColor || '#A78BFA',
                      },
                    ]
                  : [{ name: session.hostName, color: session.hostAvatarColor }]
              }
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-content w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Panduan jika izin kamera belum diberikan (PRD 7.3 A & DesignRuangFoto.md 10) */}
        {cameraError && (
          <div
            role="alert"
            className="bg-rf-coral border-3 border-rf-ink rounded-[16px] shadow-hard p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                size={22}
                strokeWidth={2.5}
                aria-hidden="true"
                className="shrink-0 mt-0.5 text-rf-ink"
              />
              <p className="text-[14px] leading-[20px] font-bold text-rf-ink">
                {cameraError}
              </p>
            </div>
            <RfButton
              type="button"
              variant="highlight"
              onClick={initLocalMedia}
              className="shrink-0 min-h-[44px] px-4 text-[14px]"
            >
              <RefreshCw size={18} strokeWidth={2.5} aria-hidden="true" />
              <span>Coba izinkan lagi</span>
            </RfButton>
          </div>
        )}

        {/* Saat menunggu guest: tampilkan kotak link undangan di atas/tengah (DesignRuangFoto.md 6.4) */}
        {!partnerPresent && <InviteLinkBox inviteUrl={inviteUrl} />}

        {/* Peringatan jika salah satu pihak belum mengunggah foto > 15 detik (PRD 7.3 A) */}
        {uploadTimeoutWarning && (
          <div
            role="status"
            className="bg-rf-yellow border-3 border-rf-ink rounded-[16px] shadow-hard p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <p className="text-[14px] font-bold text-rf-ink">
              Unggahan foto pose {session.currentPose} dari salah satu sisi
              terhambat koneksi. Kamu bisa mengulang pose ini.
            </p>
            <RfButton
              type="button"
              variant="secondary"
              onClick={() => handleRetakePose(session.currentPose)}
              className="min-h-[44px] px-4 text-[14px]"
            >
              <RotateCcw size={18} strokeWidth={2.5} aria-hidden="true" />
              <span>Ulangi pose {session.currentPose}</span>
            </RfButton>
          </div>
        )}

        {/* Dua Jendela Video Berdampingan (Desktop: Kamu kiri, Pasangan kanan; Mobile: Pasangan atas, Kamu bawah sesuai 6.4) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Tile Kamu (di mobile urutan ke-2, di desktop urutan ke-1) */}
          <div className="order-2 lg:order-1 flex flex-col gap-2">
            <VideoTile
              name={`${user.name} (Kamu)${myReady ? ' · Siap' : ''}`}
              avatarColor={user.avatarColor}
              connectionState="terhubung"
              micOn={micOn}
              camOn={camOn && !cameraError}
              videoRef={localVideoRef}
              isLocal
              countdownOverlay={
                <CountdownOverlay
                  step={countdownStep}
                  showFlash={showFlash}
                />
              }
            />
          </div>

          {/* Tile Pasangan (di mobile urutan ke-1, di desktop urutan ke-2) */}
          <div className="order-1 lg:order-2 flex flex-col gap-2">
            <VideoTile
              name={`${partnerName}${partnerReady ? ' · Siap' : ''}`}
              avatarColor={partnerAvatarColor}
              isWaitingPartner={!partnerPresent}
              connectionState={
                !partnerPresent
                  ? 'menyambung'
                  : isSimulatedPartner
                    ? 'terhubung'
                    : peerState
              }
              micOn={partnerMicOn}
              camOn={partnerCamOn}
              videoRef={remoteVideoRef}
              isSimulatedPartner={isSimulatedPartner}
              onEnableSimulatedPartner={
                isHost ? handleEnableSimulatedPartner : undefined
              }
              countdownOverlay={
                partnerPresent ? (
                  <CountdownOverlay
                    step={countdownStep}
                    showFlash={showFlash}
                  />
                ) : undefined
              }
            />
          </div>
        </div>

        {/* Baris Status Siap & Opsi Foto Ulang Tanpa Batas (FR-07) */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-rf-white border-3 border-rf-ink rounded-[16px] shadow-hard-sm px-4 py-3">
          <div className="flex items-center gap-2.5 text-[14px] leading-[20px] font-bold text-rf-ink">
            <ShieldCheck
              size={20}
              strokeWidth={2.5}
              aria-hidden="true"
              className="shrink-0"
            />
            <span>
              {uploadingPhoto
                ? 'Mengunggah foto beresolusi penuh…'
                : !partnerPresent
                  ? 'Bagikan link undangan atau gunakan tombol simulasi untuk mencoba sendiri.'
                  : myReady && !partnerReady
                    ? `Kamu sudah siap. Menunggu ${partnerName} menekan tombol Siap…`
                    : !myReady && partnerReady
                      ? `${partnerName} sudah siap! Tekan tombol Siap untuk memulai hitungan mundur.`
                      : 'Video tidak direkam. Hanya foto yang disimpan, dan terhapus dalam 1x24 jam.'}
            </span>
          </div>

          {/* Tombol foto ulang tanpa batas (pose sebelumnya atau seluruh sesi) */}
          {(session.currentPose > 1 ||
            session.poses.some((p) => p.hostDataUrl || p.guestDataUrl)) && (
            <div className="flex flex-wrap items-center gap-2">
              {session.currentPose > 1 && (
                <button
                  type="button"
                  disabled={countdownStep !== null}
                  onClick={() => handleRetakePose(session.currentPose - 1)}
                  className="rf-btn min-h-[40px] px-3 text-[13px] bg-rf-yellow"
                >
                  <RotateCcw size={16} strokeWidth={2.5} aria-hidden="true" />
                  <span>Ulangi pose {session.currentPose - 1}</span>
                </button>
              )}
              <button
                type="button"
                disabled={countdownStep !== null}
                onClick={handleRetakeAll}
                className="rf-btn min-h-[40px] px-3 text-[13px] bg-rf-white"
              >
                <RotateCcw size={16} strokeWidth={2.5} aria-hidden="true" />
                <span>Foto ulang dari awal</span>
              </button>
            </div>
          )}
        </div>

        {/* Bilah Kontrol Sesi (DesignRuangFoto.md 5.2 & 6.4) */}
        <SessionControlBar
          micOn={micOn}
          camOn={camOn}
          isReady={myReady}
          partnerPresent={partnerPresent}
          isCountingDown={countdownStep !== null}
          onToggleMic={handleToggleMic}
          onToggleCam={handleToggleCam}
          onToggleReady={handleToggleReady}
          onLeave={() => router.push('/app')}
        />
      </main>
    </div>
  );
}
