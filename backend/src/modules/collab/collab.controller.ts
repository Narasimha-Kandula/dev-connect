import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CollabService } from './collab.service';
import { CreateRoomDto } from './dto/collab.dto';

@UseGuards(JwtAuthGuard)
@Controller('collab')
export class CollabController {
  constructor(private collabService: CollabService) {}

  @Post('rooms')
  createRoom(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRoomDto,
  ) {
    return this.collabService.createRoom(dto.name ?? '', userId, dto.projectId, dto.matchId);
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
  listRooms(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.collabService.listActiveRooms(userId, limit ? parseInt(limit, 10) : undefined, cursor);
  }

  @Get('rooms/:id')
  getRoom(@Param('id') id: string) {
    return this.collabService.getRoom(id);
  }
}
