import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InviteService } from './invite.service';

class SendInviteDto {
  receiverId!: string;
  message?: string;
}

class RespondInviteDto {
  action!: 'ACCEPTED' | 'REJECTED';
}

@UseGuards(JwtAuthGuard)
@Controller('invite')
export class InviteController {
  constructor(private inviteService: InviteService) {}

  @Post()
  send(@CurrentUser('id') senderId: string, @Body() dto: SendInviteDto) {
    return this.inviteService.send(senderId, dto.receiverId, dto.message);
  }

  @Get('received')
  listReceived(@CurrentUser('id') userId: string, @Query('status') status?: InvitationStatus) {
    return this.inviteService.listReceived(userId, status);
  }

  @Get('sent')
  listSent(@CurrentUser('id') userId: string) {
    return this.inviteService.listSent(userId);
  }

  @Post(':id/respond')
  respond(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: RespondInviteDto) {
    return this.inviteService.respond(id, userId, dto.action);
  }
}
