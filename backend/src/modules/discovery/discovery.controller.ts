import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DiscoveryService } from './discovery.service';

@UseGuards(JwtAuthGuard)
@Controller('discover')
export class DiscoveryController {
  constructor(private discoveryService: DiscoveryService) {}

  @Get()
  getFeed(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    return this.discoveryService.getFeed(userId, limit ? parseInt(limit, 10) : undefined);
  }
}
