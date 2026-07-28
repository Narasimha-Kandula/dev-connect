import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(private prisma: PrismaService) {}

  generateSecret(): { secret: string; qrCodeUrl: string } {
    const secret = crypto.randomBytes(20).toString('hex');
    const encodedSecret = Buffer.from(secret, 'hex').toString('base64').replace(/=+$/, '');
    const qrCodeUrl = `otpauth://totp/DevConnect:${encodedSecret}?secret=${encodedSecret}&issuer=DevConnect`;
    return { secret: encodedSecret, qrCodeUrl };
  }

  verifyToken(secret: string, token: string): boolean {
    const counter = Math.floor(Date.now() / 30000);
    const expected = this.generateTotp(secret, counter);
    const expectedPrev = this.generateTotp(secret, counter - 1);
    return token === expected || token === expectedPrev;
  }

  async enable(userId: string, secret: string, token: string) {
    if (!this.verifyToken(secret, token)) {
      throw new BadRequestException('Invalid MFA token');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret, mfaEnabled: true },
    });
  }

  async disable(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: null, mfaEnabled: false },
    });
  }

  private generateTotp(secret: string, counter: number): string {
    const buffer = Buffer.alloc(8);
    let c = counter;
    for (let i = 7; i >= 0; i--) { buffer[i] = c & 0xff; c >>= 8; }
    const hmac = crypto
      .createHmac('sha1', Buffer.from(secret, 'base64'))
      .update(buffer)
      .digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    return String(code % 1000000).padStart(6, '0');
  }
}
