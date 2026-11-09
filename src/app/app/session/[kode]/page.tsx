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
  // Nilai Siap optimistik: tombol langsung berubah saat ditekan tanpa menunggu server
  const [readyOverride, setReadyOverride] = useState<boolean | null>(null);
  const readyPendingRef = useRef(false);
  // Naik setiap kali sesi diperbarui dari respons aksi, agar hasil polling lama diabaikan
  const sessionVersionRef = useRef(0);
  const prevPoseRef = useRef<number | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const makingOfferRef = useRef(false);
  const startWebRTCOfferRef = useRef<(isRestart?: boolean) => Promise<void>>(
    async () => {}
  );
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const processedSignalIdsRef = useRef<Set<string>>(new Set());
  const fetchingSessionRef = useRef(false);
  const pollingSignalsRef = useRef(false);
  const lastSignalPollMsRef = useRef<number>(0);
  const peerStateRef = useRef<ConnectionState>('menyambung');
  const bcRef = useRef<BroadcastChannel | null>(null);
  const rtChannelRef = useRef<RealtimeChannel | null>(null);
  const lastSignalTimeRef = useRef<number>(0);
  const serverOffsetRef = useRef<number>(0);
  const activeCountdownIdRef = useRef<number | null>(null);
  const countdownTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    peerStateRef.current = peerState;
  }, [peerState]);

  const rememberProcessedSignalId = useCallback((sigId: string) => {
    const set = processedSignalIdsRef.current;
    if (set.size >= 200) {
      const oldest = set.values().next().value;
      if (oldest) set.delete(oldest);
    }
    set.add(sigId);
  }, []);

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

  // 2. Hubungkan track media lokal ke RTCPeerConnection (update sender jika sudah ada)
  const attachLocalTracksToPeer = useCallback(
    (pc: RTCPeerConnection, stream: MediaStream) => {
      const senders = pc.getSenders();
      stream.getTracks().forEach((track) => {
        const existingSender = senders.find(
          (s) =>
            s.track?.kind === track.kind ||
            (s as unknown as { track: MediaStreamTrack | null }).track?.kind ===
              track.kind
        );
        if (existingSender) {
          existingSender.replaceTrack(track).catch(() => {});
        } else {
          try {
            pc.addTrack(track, stream);
          } catch {
            // Track mungkin sudah terdaftar
          }
        }
      });
    },
    []
  );

  // Minta izin kamera & mikrofon saat masuk ruang sesi (PRD 10)
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
        localVideoRef.current.play().catch(() => {});
      }
      if (pcRef.current) {
        attachLocalTracksToPeer(pcRef.current, stream);
      }
    } catch {
      setCameraError(
        'Kamera belum diizinkan. Buka pengaturan browser, izinkan kamera, lalu muat ulang halaman.'
      );
    } finally {
      setLocalMediaReady(true);
    }
  }, [attachLocalTracksToPeer]);

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
      localVideoRef.current.play().catch(() => {});
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      remoteVideoRef.current.play().catch(() => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.muted = true;
          remoteVideoRef.current.play().catch(() => {});
        }
      });
    }
  }, [camOn, session, peerState]);

  // Jika browser sempat membisukan video remote karena autoplay policy, bunyikan saat pengguna klik layar
  useEffect(() => {
    const tryUnmute = () => {
      if (remoteVideoRef.current && remoteVideoRef.current.muted) {
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.play().catch(() => {
          if (remoteVideoRef.current) remoteVideoRef.current.muted = true;
        });
      }
    };
    window.addEventListener('click', tryUnmute, { passive: true });
    window.addEventListener('touchstart', tryUnmute, { passive: true });
    return () => {
      window.removeEventListener('click', tryUnmute);
      window.removeEventListener('touchstart', tryUnmute);
    };
  }, []);

  // 3. Ambil & sinkronkan data sesi dari server
  const fetchSessionState = useCallback(
    async (isBackgroundPoll = false) => {
      if (!kode || !user) return;
      if (isBackgroundPoll && fetchingSessionRef.current) return;
      fetchingSessionRef.current = true;
      const startedVersion = sessionVersionRef.current;
      const reqStartedAt = Date.now();
      try {
        const res = await fetch(`/api/sessions/${kode}`, { cache: 'no-store' });
        const rtt = Date.now() - reqStartedAt;
        const data = await res.json();
        if (typeof data?.serverTime === 'number') {
          serverOffsetRef.current =
            data.serverTime - (Date.now() - Math.round(rtt / 2));
        }
        // Abaikan respons polling yang dimulai sebelum sesi diperbarui oleh aksi lokal
        if (sessionVersionRef.current !== startedVersion) return;
        if (!res.ok || !data.session) {
          setSessionError(
            data.error || 'Sesi tidak ditemukan atau sudah berakhir.'
          );
          setLoadingSession(false);
          return;
        }

        const loaded: PhotoboothSession = data.session;
        if (loaded.status === 'kedaluwarsa') {
          setSessionError(
            'Waktu sesi 15 menit telah habis. Silakan buat sesi baru.'
          );
          setLoadingSession(false);
          return;
        }

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
      } finally {
        fetchingSessionRef.current = false;
      }
    },
    [kode, user]
  );

  useEffect(() => {
    fetchSessionState(false);
    const poll = setInterval(() => fetchSessionState(true), 1200);
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
      rememberProcessedSignalId(sigId);
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
    [kode, user, rememberProcessedSignalId]
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

      if (pcRef.current) {
        if (localStreamRef.current) {
          attachLocalTracksToPeer(pcRef.current, localStreamRef.current);
        }
        return pcRef.current;
      }

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
          // Gunakan sendrecv agar slot negosiasi dua arah siap menyalurkan video/audio begitu kamera aktif
          pc.addTransceiver('video', { direction: 'sendrecv' });
          pc.addTransceiver('audio', { direction: 'sendrecv' });
        } catch {
          // Ignore transceiver error
        }
      }

      pc.ontrack = (event) => {
        let stream = event.streams?.[0];
        if (!stream) {
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream();
          }
          remoteStreamRef.current.addTrack(event.track);
          stream = remoteStreamRef.current;
        } else {
          remoteStreamRef.current = stream;
        }

        const playRemote = () => {
          if (remoteVideoRef.current) {
            if (remoteVideoRef.current.srcObject !== stream) {
              remoteVideoRef.current.srcObject = stream;
            }
            remoteVideoRef.current.play().catch(() => {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.muted = true;
                remoteVideoRef.current.play().catch(() => {});
              }
            });
          }
        };

        event.track.onunmute = playRemote;
        playRemote();
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
        } else if (pc.connectionState === 'connecting') {
          setPeerState('menyambung');
        } else if (pc.connectionState === 'failed') {
          setPeerState('terputus');
          if (role === 'host') {
            startWebRTCOfferRef.current(true);
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (
          pc.iceConnectionState === 'connected' ||
          pc.iceConnectionState === 'completed'
        ) {
          setPeerState('terhubung');
        } else if (pc.iceConnectionState === 'checking') {
          setPeerState('menyambung');
        } else if (pc.iceConnectionState === 'failed') {
          setPeerState('terputus');
          if (role === 'host') {
            startWebRTCOfferRef.current(true);
          }
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [sendSignal, attachLocalTracksToPeer]
  );

  const startWebRTCOffer = useCallback(
    async (isRestart = false) => {
      const pc = ensurePeerConnection('host', isRestart);
      if (makingOfferRef.current) return;
      if (!isRestart && pc.signalingState !== 'stable') return;

      try {
        makingOfferRef.current = true;
        if (localStreamRef.current) {
          attachLocalTracksToPeer(pc, localStreamRef.current);
        }
        const offer = await pc.createOffer(
          isRestart ? { iceRestart: true } : undefined
        );
        if (pc.signalingState !== 'stable' && !isRestart) return;
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
      } finally {
        makingOfferRef.current = false;
      }
    },
    [ensurePeerConnection, sendSignal, attachLocalTracksToPeer]
  );

  useEffect(() => {
    startWebRTCOfferRef.current = startWebRTCOffer;
  }, [startWebRTCOffer]);

  const handleIncomingSignal = useCallback(
    async (msg: WebRTCSignalMessage, myRole: 'host' | 'guest') => {
      if (!user || msg.senderId === user.id) return;
      if (msg.id) {
        if (processedSignalIdsRef.current.has(msg.id)) return;
        rememberProcessedSignalId(msg.id);
      }
      if (msg.createdAt) {
        lastSignalTimeRef.current = Math.max(
          lastSignalTimeRef.current,
          msg.createdAt
        );
      }

      if (msg.type === 'state-sync') {
        fetchSessionState(false);
        return;
      }

      if (msg.type === 'peer-ready') {
        fetchSessionState(false);
        if (myRole === 'host') {
          const isAlreadyConnected =
            pcRef.current?.connectionState === 'connected' ||
            pcRef.current?.iceConnectionState === 'connected' ||
            pcRef.current?.iceConnectionState === 'completed';
          await startWebRTCOffer(!isAlreadyConnected);
        }
        return;
      }

      try {
        if (msg.type === 'offer' && msg.payload.sdp) {
          const pc = ensurePeerConnection(myRole, false);
          if (pc.signalingState !== 'stable') {
            await Promise.all([
              pc.setLocalDescription({ type: 'rollback' }),
            ]).catch(() => {});
          }
          await pc.setRemoteDescription(
            new RTCSessionDescription(
              msg.payload.sdp as RTCSessionDescriptionInit
            )
          );
          await flushPendingCandidates(pc);
          if (localStreamRef.current) {
            attachLocalTracksToPeer(pc, localStreamRef.current);
          }
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
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch {
              // Ignore stale candidate
            }
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
      attachLocalTracksToPeer,
      rememberProcessedSignalId,
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
      setPeerState((prev) =>
        prev === 'terhubung' ? 'terhubung' : 'menyambung'
      );
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
        startWebRTCOffer(false);
      } else {
        sendSignal('peer-ready', {}, 'guest');
      }
    }

    const pollSignals = async (isIntervalTick = false) => {
      if (pollingSignalsRef.current) return;
      const now = Date.now();
      if (
        isIntervalTick &&
        peerStateRef.current === 'terhubung' &&
        now - lastSignalPollMsRef.current < 2400
      ) {
        return;
      }
      pollingSignalsRef.current = true;
      lastSignalPollMsRef.current = now;
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
      } finally {
        pollingSignalsRef.current = false;
      }
    };

    pollSignals(false);
    const signalInterval = setInterval(() => pollSignals(true), 800);

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
      const currentServerNow = Date.now() + serverOffsetRef.current;
      const diffSec = Math.max(
        0,
        Math.floor(
          (new Date(session.expiresAt).getTime() - currentServerNow) / 1000
        )
      );
      setRemainingSessionSec(diffSec);
      if (diffSec <= 0 && session.status !== 'selesai') {
        clearCountdownTimers();
        setCountdownStep(null);
        setShowFlash(false);
        setSessionError(
          'Waktu sesi 15 menit telah habis. Silakan buat sesi baru.'
        );
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session?.expiresAt, session?.status, clearCountdownTimers]);

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

    const currentServerNow = Date.now() + serverOffsetRef.current;
    const delayUntilStart = Math.max(
      0,
      session.countdownStartedAt - currentServerNow
    );

    // Jadwalkan 3, 2, 1, cekrek tepat serempak
    const t3 = setTimeout(() => setCountdownStep(3), delayUntilStart);
    const t2 = setTimeout(() => setCountdownStep(2), delayUntilStart + 1000);
    const t1 = setTimeout(() => setCountdownStep(1), delayUntilStart + 2000);
    const t0 = setTimeout(() => {
      setCountdownStep('cekrek');
      setShowFlash(true);
      captureAndUploadPoseRef.current(poseToCapture, myRole, isSimulated);
    }, delayUntilStart + 3000);
    const tFlash = setTimeout(() => {
      setShowFlash(false);
    }, delayUntilStart + 3150);
    const tDone = setTimeout(() => {
      setCountdownStep(null);
    }, delayUntilStart + 3600);

    countdownTimersRef.current = [t3, t2, t1, t0, tFlash, tDone];
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

  // Beri tahu dengan jelas saat satu pose selesai dan sesi lanjut ke pose berikutnya
  const currentPoseNumber = session?.currentPose ?? null;
  useEffect(() => {
    if (currentPoseNumber === null) return;
    const prev = prevPoseRef.current;
    prevPoseRef.current = currentPoseNumber;
    if (prev !== null && currentPoseNumber === prev + 1) {
      showToast(
        `Pose ${prev} tersimpan! Tekan Siap untuk lanjut ke pose ${currentPoseNumber}.`,
        'success'
      );
    }
  }, [currentPoseNumber, showToast]);

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
  const serverMyReady = isHost ? session.hostReady : session.guestReady;
  const myReady = readyOverride ?? serverMyReady;
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

    if (readyPendingRef.current) return;
    readyPendingRef.current = true;

    const nextReady = !myReady;
    setReadyOverride(nextReady);
    try {
      const res = await fetch(`/api/sessions/${kode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set-ready',
          role: myRole,
          ready: nextReady,
        }),
      });
      let data = await res.json();

      // Jika pasangan adalah Simulasi, otomatis ikut siap agar countdown langsung mulai
      if (isSimulatedPartner && nextReady) {
        const simRes = await fetch(`/api/sessions/${kode}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'set-ready',
            role: 'guest',
            ready: true,
          }),
        });
        data = await simRes.json();
      }

      // Terapkan respons server langsung agar countdown mulai tanpa menunggu polling
      if (typeof data?.serverTime === 'number') {
        serverOffsetRef.current = data.serverTime - Date.now();
      }
      if (data?.session) {
        sessionVersionRef.current += 1;
        setSession(data.session);
      }
      sendSignal('state-sync', {}, myRole);
    } catch {
      showToast('Gagal mengirim status Siap. Coba tekan lagi.', 'error');
    } finally {
      readyPendingRef.current = false;
      setReadyOverride(null);
    }
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

  const handleLeaveSession = async () => {
    clearCountdownTimers();
    setCountdownStep(null);
    setShowFlash(false);
    try {
      await fetch(`/api/sessions/${kode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'leave-session',
          role: myRole,
        }),
      });
      await sendSignal('state-sync', {}, myRole);
    } catch {
      // Ignore network error on leave
    }
    router.push('/app');
  };

  const minsLeft = String(Math.floor(remainingSessionSec / 60)).padStart(
    2,
    '0'
  );
  const secsLeft = String(remainingSessionSec % 60).padStart(2, '0');

  // Tahap sesi saat ini → label tombol Siap & panduan langkah berikutnya
  const isCountingDown = countdownStep !== null;
  const currentPoseObj = session.poses.find(
    (p) => p.poseNumber === session.currentPose
  );
  const myPhotoTaken = Boolean(
    isHost ? currentPoseObj?.hostDataUrl : currentPoseObj?.guestDataUrl
  );
  const isComposing =
    session.status === 'selesai' ||
    (session.poses.length > 0 &&
      session.poses.every((p) => p.hostDataUrl && p.guestDataUrl));
  const readyBusyLabel = isComposing
    ? 'Menyusun…'
    : uploadingPhoto || myPhotoTaken
      ? 'Menyimpan…'
      : null;

  let readyHint: string;
  let readyHintNeedsAction = false;
  if (!partnerPresent) {
    readyHint =
      'Bagikan link undangan atau gunakan tombol simulasi untuk mencoba sendiri.';
  } else if (isComposing) {
    readyHint = 'Semua pose selesai! Sedang menyusun photostrip kalian…';
  } else if (isCountingDown) {
    readyHint = `Bergaya sekarang! Foto pose ${session.currentPose} diambil saat hitungan habis.`;
  } else if (uploadingPhoto) {
    readyHint = `Menyimpan foto pose ${session.currentPose}…`;
  } else if (myPhotoTaken) {
    readyHint = `Fotomu tersimpan. Menunggu foto ${partnerName}…`;
  } else if (myReady && partnerReady) {
    readyHint = 'Kalian berdua siap! Hitung mundur dimulai…';
  } else if (myReady) {
    readyHint = `Kamu sudah siap. Menunggu ${partnerName} menekan Siap… Tekan "Batal siap" jika belum siap.`;
  } else {
    readyHintNeedsAction = true;
    readyHint = partnerReady
      ? `${partnerName} sudah siap! Tekan Siap untuk mulai hitung mundur pose ${session.currentPose}.`
      : session.currentPose > 1
        ? `Lanjut ke pose ${session.currentPose} dari ${template.poseCount}. Tekan Siap saat kamu sudah siap bergaya.`
        : 'Tekan Siap saat kamu sudah siap bergaya. Hitung mundur dimulai setelah kalian berdua siap.';
  }

  return (
    <div className="min-h-screen bg-rf-bg text-rf-ink flex flex-col justify-between pb-48 lg:pb-8">
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
              Video tidak direkam. Hanya foto yang disimpan, dan terhapus dalam
              1x24 jam.
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
          isCountingDown={isCountingDown}
          currentPose={session.currentPose}
          busyLabel={readyBusyLabel}
          hint={readyHint}
          hintNeedsAction={readyHintNeedsAction}
          onToggleMic={handleToggleMic}
          onToggleCam={handleToggleCam}
          onToggleReady={handleToggleReady}
          onLeave={handleLeaveSession}
        />
      </main>
    </div>
  );
}
