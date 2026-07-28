import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async sendVerification(userId: string, email: string): Promise<void> {
    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerificationToken: token },
    });

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;

    try {
      const { Resend } = await import('resend');
      const resend = new Resend(this.config.get('resend.apiKey'));
      await resend.emails.send({
        from: this.config.get<string>('resend.emailFrom')!,
        to: email,
        subject: 'Verify your DevConnect email',
        html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email address.</p>`,
      });
    } catch (e) {
      this.logger.error(`Failed to send verification email: ${(e as Error).message}`);
    }
  }

  async verify(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });
    if (!user) throw new BadRequestException('Invalid verification token');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationToken: null },
    });

    return { success: true };
  }
}
