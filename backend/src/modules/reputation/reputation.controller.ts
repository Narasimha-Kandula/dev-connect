import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReputationService } from './reputation.service';

@Controller('reputation')
export class ReputationController {
  constructor(private reputationService: ReputationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('reviews')
  createReview(
    @CurrentUser('id') userId: string,
    @Body('targetId') targetId: string,
    @Body('rating') rating: number,
    @Body('projectId') projectId?: string,
    @Body('comment') comment?: string,
  ) {
    return this.reputationService.createReview(userId, targetId, rating, projectId, comment);
  }

  @Get(':userId')
  getReputation(@Param('userId') userId: string) {
    return this.reputationService.getReputation(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('contributions')
  createContribution(
    @CurrentUser('id') userId: string,
    @Body('projectId') projectId: string,
    @Body('description') description?: string,
    @Body('linesOfCode') linesOfCode?: number,
    @Body('commits') commits?: number,
    @Body('tasksDone') tasksDone?: number,
  ) {
    return this.reputationService.createContribution(userId, projectId, {
      description, linesOfCode, commits, tasksDone, verified: false,
    });
  }
}
