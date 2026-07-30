import { Body, Controller, Post, Get, Delete, HttpCode, HttpStatus, UseGuards, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { OAuthService } from './oauth.service';
import { MfaService } from './mfa.service';
import { PasswordResetService } from './password-reset.service';
import { EmailVerificationService } from './email-verification.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { EnableMfaDto } from './dto/mfa.dto';
import { CreateApiKeyDto } from './dto/api-key.dto';
import { OAuthDto } from './dto/oauth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private oauthService: OAuthService,
    private mfaService: MfaService,
    private passwordResetService: PasswordResetService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  oauth(@Body() dto: OAuthDto, @Req() req: Request) {
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip;
    const userAgent = req.headers['user-agent'];
    return this.oauthService.authenticate(dto.code, dto.provider, dto.redirectUri, userAgent, ipAddress);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordResetService.sendResetEmail(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto.token, dto.password);
  }

  @Post('send-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  sendVerification(@CurrentUser('id') userId: string, @CurrentUser('email') email: string) {
    return this.emailVerificationService.sendVerification(userId, email);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.emailVerificationService.verify(dto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  listSessions(@CurrentUser('id') userId: string) {
    return this.authService.listSessions(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  revokeSession(@CurrentUser('id') userId: string, @Param('id') sessionId: string) {
    return this.authService.revokeSession(userId, sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mfa/setup')
  setupMfa() {
    return this.mfaService.generateSecret();
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/enable')
  enableMfa(@CurrentUser('id') userId: string, @Body() dto: EnableMfaDto) {
    return this.mfaService.enable(userId, dto.secret, dto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/disable')
  disableMfa(@CurrentUser('id') userId: string) {
    return this.mfaService.disable(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  deleteAccount(
    @CurrentUser('id') userId: string,
    @Body() body?: { password?: string },
  ) {
    return this.authService.deleteAccount(userId, body?.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('export')
  exportData(@CurrentUser('id') userId: string) {
    return this.authService.exportData(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('api-keys')
  listApiKeys(@CurrentUser('id') userId: string) {
    return this.authService.listApiKeys(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('api-keys')
  createApiKey(@CurrentUser('id') userId: string, @Body() dto: CreateApiKeyDto) {
    return this.authService.createApiKey(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('api-keys/:id')
  @HttpCode(HttpStatus.OK)
  revokeApiKey(@CurrentUser('id') userId: string, @Param('id') keyId: string) {
    return this.authService.revokeApiKey(userId, keyId);
  }
}
