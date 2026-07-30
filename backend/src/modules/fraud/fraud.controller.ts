import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FraudDetectionService } from './fraud-detection.service';

@Controller('fraud')
export class FraudController {
  constructor(private fraudDetectionService: FraudDetectionService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my-score')
  getMyScore(@CurrentUser('id') userId: string) {
    return this.fraudDetectionService.scoreUser(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Post('score/:userId')
  scoreUser(@Param('userId') userId: string) {
    return this.fraudDetectionService.scoreUser(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Post('resolve/:userId')
  resolveUser(@Param('userId') userId: string) {
    return this.fraudDetectionService.resolveFlags(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Get('check/:userId')
  checkUser(@Param('userId') userId: string) {
    return this.fraudDetectionService.checkActionRequired(userId);
  }
}
