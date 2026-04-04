import { Injectable } from '@nestjs/common';
// @ts-ignore
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

@Injectable()
export class MfaService {
  /**
   * Generate a new TOTP secret.
   */
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * Generate a TOTP URL for a QR code.
   * @param userEmail The email of the user
   * @param secret The TOTP secret
   * @param issuer The issuer name (Teach Me Drive)
   */
  generateOtpauthUrl(userEmail: string, secret: string, issuer: string = 'Teach Me Drive'): string {
    return authenticator.keyuri(userEmail, issuer, secret);
  }

  /**
   * Generate a data URL for a QR code image.
   * @param otpauthUrl The otpauth URL
   */
  async generateQrCodeDataUrl(otpauthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (err) {
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify a TOTP token against a secret.
   * @param token The 6-digit token
   * @param secret The user's TOTP secret
   */
  verifyToken(token: string, secret: string): boolean {
    return authenticator.verify({ token, secret });
  }
}
