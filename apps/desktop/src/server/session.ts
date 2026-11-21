import crypto from 'crypto';

export interface PairingSession {
  sessionId: string;
  token: string;
  pin: string; // 4-digit fallback PIN
  createdAt: number;
  expiresAt: number;
  isUsed: boolean;
  clientIp?: string;
  deviceModel?: string;
}

export class SessionManager {
  private currentSession: PairingSession | null = null;
  private readonly sessionTtlMs = 120 * 60 * 1000; // 120 minutes (prevents unexpected expiry during gameplay)

  constructor() {
    this.generateNewSession();
  }

  public generateNewSession(): PairingSession {
    const sessionId = crypto.randomBytes(8).toString('hex');
    const token = crypto.randomBytes(16).toString('hex');
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const now = Date.now();

    this.currentSession = {
      sessionId,
      token,
      pin,
      createdAt: now,
      expiresAt: now + this.sessionTtlMs,
      isUsed: false,
    };

    return this.currentSession;
  }

  public getCurrentSession(): PairingSession {
    if (!this.currentSession || Date.now() > this.currentSession.expiresAt) {
      return this.generateNewSession();
    }
    return this.currentSession;
  }

  public validatePairing(token?: string, pin?: string, clientIp?: string): { valid: boolean; reason?: string } {
    if (!this.currentSession) {
      return { valid: false, reason: 'No active pairing session' };
    }

    if (Date.now() > this.currentSession.expiresAt) {
      return { valid: false, reason: 'Pairing session has expired' };
    }

    // Match by token or by 4-digit PIN
    const tokenMatch = token && token === this.currentSession.token;
    const pinMatch = pin && pin === this.currentSession.pin;

    if (!tokenMatch && !pinMatch) {
      return { valid: false, reason: 'Invalid token or PIN' };
    }

    this.currentSession.isUsed = true;
    this.currentSession.clientIp = clientIp;
    return { valid: true };
  }

  public invalidate(): void {
    this.currentSession = null;
  }
}
