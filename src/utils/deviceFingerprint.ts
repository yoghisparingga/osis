// Utilities for client device fingerprinting and 24-hour local lock management

const FINGERPRINT_KEY = 'evoting_device_fingerprint_v1';
const VOTER_PASS_KEY = 'evoting_voter_pass_v1';
const LOCKOUT_KEY = 'evoting_lockout_timestamp_v1';

export function getOrCreateDeviceFingerprint(): string {
  try {
    let fp = localStorage.getItem(FINGERPRINT_KEY);
    if (!fp) {
      // Create a deterministic pseudo-fingerprint using browser characteristics
      const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const lang = navigator.language || '';
      const platform = navigator.platform || '';
      const randomSeed = Math.random().toString(36).substring(2, 10);
      
      const raw = `fp-${platform}-${screenInfo}-${tz}-${lang}-${Date.now()}-${randomSeed}`;
      // Basic hash
      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        hash = (hash << 5) - hash + raw.charCodeAt(i);
        hash |= 0;
      }
      fp = 'dev-' + Math.abs(hash).toString(36) + '-' + randomSeed;
      localStorage.setItem(FINGERPRINT_KEY, fp);
    }
    return fp;
  } catch {
    return 'temp-fp-' + Math.random().toString(36).substring(2, 10);
  }
}

export function saveLocalVoterPass(passData: any) {
  try {
    localStorage.setItem(VOTER_PASS_KEY, JSON.stringify(passData));
    localStorage.setItem(LOCKOUT_KEY, String(Date.now()));
  } catch (e) {
    console.warn('Failed to save local pass:', e);
  }
}

export function getLocalVoterPass(): { passData: any; remainingMs: number } | null {
  try {
    const rawPass = localStorage.getItem(VOTER_PASS_KEY);
    const rawLockout = localStorage.getItem(LOCKOUT_KEY);
    if (!rawPass || !rawLockout) return null;

    const timestamp = parseInt(rawLockout, 10);
    const now = Date.now();
    const lockoutPeriod = 24 * 60 * 60 * 1000; // 24 hours
    const elapsed = now - timestamp;

    if (elapsed < lockoutPeriod) {
      return {
        passData: JSON.parse(rawPass),
        remainingMs: lockoutPeriod - elapsed
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function formatRemainingTime(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)} jam ${pad(minutes)} menit ${pad(seconds)} detik`;
}
