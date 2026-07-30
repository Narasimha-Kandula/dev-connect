import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SwipeLimitsService } from './swipe-limits.service';

@Injectable()
export class SwipeLimitGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private swipeLimitsService: SwipeLimitsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { planTier: true },
    });

    if (!userRecord) return false;

    const { remaining } = await this.swipeLimitsService.getRemainingSwipes(
      user.id,
      userRecord.planTier,
    );

    if (remaining <= 0) {
      const limit = this.swipeLimitsService.getDailyLimit(userRecord.planTier);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Daily swipe limit reached (${limit}). Upgrade to PRO for more swipes.`,
          limit,
          planTier: userRecord.planTier,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
