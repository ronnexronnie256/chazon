import crypto from 'crypto';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const OTP_STORE = new Map<
  string,
  { otp: string; expiresAt: number; attempts: number }
>();

export function generateOTP(): string {
  return crypto
    .randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, '0');
}

export function storeOTP(phone: string, otp: string): void {
  const key = normalizePhoneKey(phone);
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;

  OTP_STORE.set(key, {
    otp,
    expiresAt,
    attempts: 0,
  });

  setTimeout(
    () => {
      OTP_STORE.delete(key);
    },
    OTP_EXPIRY_MINUTES * 60 * 1000 + 60000
  );
}

export function verifyOTP(
  phone: string,
  inputOtp: string
): { valid: boolean; reason?: string } {
  const key = normalizePhoneKey(phone);
  const stored = OTP_STORE.get(key);

  if (!stored) {
    return { valid: false, reason: 'OTP expired or not requested' };
  }

  if (Date.now() > stored.expiresAt) {
    OTP_STORE.delete(key);
    return { valid: false, reason: 'OTP has expired' };
  }

  if (stored.attempts >= 3) {
    OTP_STORE.delete(key);
    return {
      valid: false,
      reason: 'Too many attempts. Please request a new OTP',
    };
  }

  if (stored.otp !== inputOtp) {
    stored.attempts++;
    return {
      valid: false,
      reason: `Invalid OTP. ${3 - stored.attempts} attempts remaining`,
    };
  }

  OTP_STORE.delete(key);
  return { valid: true };
}

export function clearOTP(phone: string): void {
  const key = normalizePhoneKey(phone);
  OTP_STORE.delete(key);
}

function normalizePhoneKey(phone: string): string {
  return phone.replace(/[^0-9]/g, '').slice(-9);
}

export { OTP_STORE };
