// src/lib/2fa.ts
import { TOTP, generateSecret as otplibGenerateSecret } from 'otplib';
import QRCode from 'qrcode';

// Create TOTP instance with crypto plugin
import { NobleCryptoPlugin } from 'otplib';
import { ScureBase32Plugin } from 'otplib';

const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
});

/**
 * Generate a TOTP secret for a user
 */
export function generateSecret(): string {
  return otplibGenerateSecret();
}

/**
 * Generate OTP Auth URL for QR code
 */
export function generateOtpAuthUrl(email: string, secret: string, issuer: string = 'OtsemPay'): string {
  return totp.toURI({
    issuer,
    label: email,
    secret,
  });
}

/**
 * Generate QR code data URL from OTP Auth URL
 */
export async function generateQRCode(otpAuthUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpAuthUrl);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify a TOTP token against a secret
 */
export async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    const result = await totp.verify(token, { secret });
    return result.valid;
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
}

/**
 * Generate backup codes (8-digit codes) using cryptographically secure RNG
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  const array = new Uint32Array(count);
  crypto.getRandomValues(array);
  for (let i = 0; i < count; i++) {
    // Map to 8-digit range [10000000, 99999999]
    const code = (10000000 + (array[i] % 90000000)).toString();
    codes.push(code);
  }
  return codes;
}

/**
 * Format backup code for display (XXXX-XXXX)
 */
export function formatBackupCode(code: string): string {
  if (code.length !== 8) return code;
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Validate TOTP code format (6 digits)
 */
export function isValidTotpFormat(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Validate backup code format (8 digits)
 */
export function isValidBackupCodeFormat(code: string): boolean {
  // Allow both formatted (XXXX-XXXX) and unformatted (XXXXXXXX)
  return /^\d{8}$/.test(code) || /^\d{4}-\d{4}$/.test(code);
}

/**
 * Remove formatting from backup code
 */
export function normalizeBackupCode(code: string): string {
  return code.replace(/-/g, '');
}

/**
 * Get current TOTP token (for testing purposes)
 */
export async function getCurrentToken(secret: string): Promise<string> {
  return await totp.generate({ secret });
}
