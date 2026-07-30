import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { SetPreferenceDto } from './dto/notification.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser('id') userId: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.notificationsService.list(userId, limit ? parseInt(limit, 10) : undefined, offset ? parseInt(offset, 10) : undefined);
  }

  @Patch(':id/read')
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notificationsService.markRead(userId, id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @Get('unread')
  unreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.unreadCount(userId);
  }

  @Get('preferences')
  getPreferences(@CurrentUser('id') userId: string) {
    return this.notificationsService.getPreferences(userId);
  }

  @Post('preferences')
  setPreference(
    @CurrentUser('id') userId: string,
    @Body() dto: SetPreferenceDto,
  ) {
    return this.notificationsService.setPreference(userId, dto.type, dto.channel, dto.enabled);
  }
}
