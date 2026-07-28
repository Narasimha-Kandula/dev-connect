import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { OAuthService } from './oauth.service';
import { MfaService } from './mfa.service';
import { PasswordResetService } from './password-reset.service';
import { EmailVerificationService } from './email-verification.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('app.jwt.secret')!,
        signOptions: { expiresIn: config.get<string>('app.jwt.accessExpiresIn') as `${number}${'s' | 'm' | 'h' | 'd'}` },
      }),
    }),
  ],
  providers: [AuthService, OAuthService, MfaService, PasswordResetService, EmailVerificationService, JwtStrategy],
  controllers: [AuthController],
  exports: [JwtModule, PassportModule, JwtStrategy, AuthService],
})
export class AuthModule {}
