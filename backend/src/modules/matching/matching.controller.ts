import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsUUID } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MatchingService } from './matching.service';

class SwipeDto {
  @IsUUID()
  targetId!: string;

  @IsIn(['LIKE', 'SUPER_LIKE', 'PASS'])
  action!: 'LIKE' | 'SUPER_LIKE' | 'PASS';
}

@UseGuards(JwtAuthGuard)
@Controller()
export class MatchingController {
  constructor(private matchingService: MatchingService) {}

  @Post('discover/swipe')
  swipe(@CurrentUser('id') userId: string, @Body() dto: SwipeDto) {
    return this.matchingService.swipe(userId, dto.targetId, dto.action);
  }

  @Get('matches')
  matches(@CurrentUser('id') userId: string) {
    return this.matchingService.listMatches(userId);
  }

  @Get('connections')
  connections(@CurrentUser('id') userId: string) {
    return this.matchingService.listConnections(userId);
  }
}
