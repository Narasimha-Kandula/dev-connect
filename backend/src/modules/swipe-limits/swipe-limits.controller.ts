import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SwipeLimitsService } from './swipe-limits.service';
import { PrismaService } from '../../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('swipe-limits')
export class SwipeLimitsController {
  constructor(
    private swipeLimitsService: SwipeLimitsService,
    private prisma: PrismaService,
  ) {}

  @Get()
  async getStatus(@CurrentUser('id') userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { planTier: true },
    });
    return this.swipeLimitsService.getRemainingSwipes(userId, user?.planTier ?? 'FREE');
  }

  @Get('history')
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query('days') days?: string,
  ) {
    return this.swipeLimitsService.getUsageHistory(userId, days ? parseInt(days, 10) : 7);
  }
}
