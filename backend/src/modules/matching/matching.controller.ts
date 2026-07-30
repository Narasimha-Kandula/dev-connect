import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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

  @Get('match/recommendations')
  getRecommendations(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.matchingService.getRecommendations(
      userId,
      limit ? Math.min(parseInt(limit, 10), 50) : 20,
    );
  }

  @Get('matches')
  matches(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.matchingService.listMatches(userId, limit ? parseInt(limit, 10) : undefined, cursor);
  }

  @Get('connections')
  connections(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.matchingService.listConnections(userId, limit ? parseInt(limit, 10) : undefined, cursor);
  }

  @Post('matches/:id/archive')
  archiveMatch(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.matchingService.archiveMatch(id, userId);
  }

  @Post('matches/:id/unmatch')
  unmatch(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.matchingService.unmatch(id, userId);
  }

  @Post('matches/:id/connect')
  createConnection(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.matchingService.createConnection(id, userId);
  }

  @Post('discover/undo')
  undoSwipe(@CurrentUser('id') userId: string) {
    return this.matchingService.undoSwipe(userId);
  }

  @Post('matches/:id/start-project')
  startProject(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('title') title: string,
  ) {
    return this.matchingService.startProject(id, userId, title);
  }
}
