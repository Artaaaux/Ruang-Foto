export type TemplateCategory = 'Retro' | 'Romantis' | 'Ceria' | 'Minimalis';

export interface FrameSlotRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Bingkai PNG transparan yang ditumpuk di atas foto (DesignRuangFoto.md 5.6).
 * Koordinat slot dalam piksel pada ukuran asli PNG; satu entri per pose.
 */
export interface FrameOverlay {
  src: string;
  width: number;
  height: number;
  slotBg?: string;
  slots: { host: FrameSlotRect; guest: FrameSlotRect }[];
}

export interface PhotoboothTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  poseCount: number;
  stripBg: string; // Hex from DesignRuangFoto.md tokens
  frameBorderColor: string;
  badgeColor: 'yellow' | 'teal' | 'purple' | 'coral' | 'pink';
  footerTagline: string;
  stickerText: string;
  frame?: FrameOverlay;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  loginMethod: 'google' | 'email';
  verified: boolean;
  avatarColor: string;
  createdAt: string;
}

export type SessionStatus = 'menunggu' | 'berjalan' | 'selesai' | 'kedaluwarsa';

export interface PosePhotoPair {
  poseNumber: number;
  hostDataUrl?: string;
  guestDataUrl?: string;
  capturedAt?: string;
}

export interface PhotoboothSession {
  id: string;
  code: string;
  templateId: string;
  hostId: string;
  hostName: string;
  hostAvatarColor: string;
  guestId?: string;
  guestName?: string;
  guestAvatarColor?: string;
  status: SessionStatus;
  hostReady: boolean;
  guestReady: boolean;
  hostMicOn: boolean;
  hostCamOn: boolean;
  guestMicOn: boolean;
  guestCamOn: boolean;
  currentPose: number; // 1-based index
  countdownStartedAt?: number | null; // Server timestamp in ms for synchronized countdown
  poses: PosePhotoPair[];
  resultId?: string;
  startedAt: string;
  completedAt?: string;
  expiresAt: string; // Session 15m timeout
}

export interface PhotoboothResult {
  id: string;
  sessionId: string;
  sessionCode: string;
  templateId: string;
  hostId: string;
  hostName: string;
  guestId?: string;
  guestName?: string;
  poses: PosePhotoPair[];
  compositeDataUrl?: string;
  createdAt: string;
  expiresAt: string; // 1x24 jam (24 hours after completion)
}

export interface WebRTCSignalMessage {
  id: string;
  sessionCode: string;
  senderId: string;
  senderRole: 'host' | 'guest';
  type:
    | 'offer'
    | 'answer'
    | 'ice-candidate'
    | 'peer-ready'
    | 'state-sync'
    | 'countdown-trigger'
    | 'photo-uploaded'
    | 'retake-pose'
    | 'retake-all';
  payload: Record<string, unknown>;
  createdAt: number;
}
