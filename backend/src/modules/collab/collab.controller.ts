import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CollabService } from './collab.service';

@UseGuards(JwtAuthGuard)
@Controller('collab')
export class CollabController {
  constructor(private collabService: CollabService) {}

  @Post('rooms')
  createRoom(
    @CurrentUser('id') userId: string,
    @Body('name') name: string,
    @Body('projectId') projectId?: string,
    @Body('matchId') matchId?: string,
  ) {
    return this.collabService.createRoom(name, userId, projectId, matchId);
  }

  @Post('rooms/:id/join')
  joinRoom(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.collabService.joinRoom(id, userId);
  }

  @Post('rooms/:id/leave')
  leaveRoom(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.collabService.leaveRoom(id, userId);
  }

  @Post('rooms/:id/end')
  endRoom(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.collabService.endRoom(id, userId);
  }

  @Get('rooms')
  listRooms(@CurrentUser('id') userId: string) {
    return this.collabService.listActiveRooms(userId);
  }

  @Get('rooms/:id')
  getRoom(@Param('id') id: string) {
    return this.collabService.getRoom(id);
  }
}
