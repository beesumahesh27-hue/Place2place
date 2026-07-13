// Global singleton so the store survives Next.js hot-reloads in dev.
declare global {
  // eslint-disable-next-line no-var
  var __otpStore: Map<string, { otp: string; expiresAt: number }> | undefined;
}

const store: Map<string, { otp: string; expiresAt: number }> =
  globalThis.__otpStore ?? new Map();
globalThis.__otpStore = store;

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function saveOtp(contact: string, otp: string): void {
  store.set(contact, { otp, expiresAt: Date.now() + OTP_TTL_MS });
}

export function verifyAndConsumeOtp(contact: string, otp: string): "ok" | "expired" | "invalid" {
  const entry = store.get(contact);
  if (!entry) return "invalid";
  if (Date.now() > entry.expiresAt) {
    store.delete(contact);
    return "expired";
  }
  if (entry.otp !== otp) return "invalid";
  store.delete(contact); // one-time use
  return "ok";
}
