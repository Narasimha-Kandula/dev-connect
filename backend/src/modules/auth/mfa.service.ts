import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return output;
}

function base32Decode(str: string): Buffer {
  const cleaned = str.replace(/=+$/, '').toUpperCase();
  const bytes: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    buffer = (buffer << 5) | idx;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bytes.push((buffer >>> (bitsLeft - 8)) & 0xff);
      bitsLeft -= 8;
    }
  }
  return Buffer.from(bytes);
}

function generateTotp(secret: string, counter: number): string {
  const buffer = Buffer.alloc(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) { buffer[i] = c & 0xff; c >>= 8; }
  const hmac = crypto
    .createHmac('sha1', base32Decode(secret))
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

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(private prisma: PrismaService) {}

  generateSecret(): { secret: string; qrCodeUrl: string } {
    const secret = base32Encode(crypto.randomBytes(20));
    const qrCodeUrl = `otpauth://totp/DevConnect:${secret}?secret=${secret}&issuer=DevConnect&algorithm=SHA1&digits=6&period=30`;
    return { secret, qrCodeUrl };
  }

  verifyToken(secret: string, token: string): boolean {
    const counter = Math.floor(Date.now() / 30000);
    for (let i = -1; i <= 1; i++) {
      if (token === generateTotp(secret, counter + i)) return true;
    }
    return false;
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
}
