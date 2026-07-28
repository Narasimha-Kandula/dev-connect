import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RecommendationsService } from './recommendations.service';

@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private recommendationsService: RecommendationsService) {}

  @Get('ai-insights')
  getAiInsights(@CurrentUser('id') userId: string) {
    return this.recommendationsService.getAiInsights(userId);
  }

  @Get('profiles')
  getRecommendations(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    return this.recommendationsService.getRecommendations(userId, limit ? parseInt(limit, 10) : undefined);
  }

  @Get('projects')
  getProjects(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    return this.recommendationsService.getRecommendedProjects(userId, limit ? parseInt(limit, 10) : undefined);
  }
}
