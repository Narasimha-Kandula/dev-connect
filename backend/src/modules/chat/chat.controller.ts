import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('conversations')
  listConversations(@CurrentUser('id') userId: string) {
    return this.chatService.listConversations(userId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.chatService.getMessages(id, userId, cursor);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.chatService.sendMessage(id, userId, content);
  }

  @Patch('conversations/:id/read')
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.chatService.markRead(id, userId);
  }
}
