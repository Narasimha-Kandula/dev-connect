import { Module } from '@nestjs/common';
import { SwipeLimitsService } from './swipe-limits.service';
import { SwipeLimitsController } from './swipe-limits.controller';
import { SwipeLimitGuard } from './swipe-limit.guard';

@Module({
  providers: [SwipeLimitsService, SwipeLimitGuard],
  controllers: [SwipeLimitsController],
  exports: [SwipeLimitsService, SwipeLimitGuard],
})
export class SwipeLimitsModule {}
