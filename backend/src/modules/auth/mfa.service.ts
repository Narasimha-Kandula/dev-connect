import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(private prisma: PrismaService) {}

  generateSecret(): { secret: string; qrCodeUrl: string } {
    const secret = crypto.randomBytes(20).toString('hex');
    const qrCodeUrl = `otpauth://totp/DevConnect:${secret}?secret=${secret}&issuer=DevConnect`;
    return { secret, qrCodeUrl };
  }

  verifyToken(secret: string, token: string): boolean {
    const counter = Math.floor(Date.now() / 30000);
    const expected = this.generateTotp(secret, counter);
    return token === expected;
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
    const hmac = crypto
      .createHmac('sha1', Buffer.from(secret, 'hex'))
      .update(Buffer.from(counter.toString(16).padStart(16, '0'), 'hex'))
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
