import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
    @Body('attachments') attachments?: { url: string; type: string; name: string }[],
  ) {
    return this.chatService.sendMessage(id, userId, content, attachments);
  }

  @Post('conversations')
  createConversation(
    @CurrentUser('id') userId: string,
    @Body('targetUserId') targetUserId: string,
  ) {
    return this.chatService.createOrGetConversation(userId, targetUserId);
  }

  @Post('conversations/group')
  createGroup(
    @CurrentUser('id') userId: string,
    @Body('name') name: string,
    @Body('memberIds') memberIds: string[],
  ) {
    return this.chatService.createGroup(name, userId, memberIds);
  }

  @Patch('messages/:id')
  editMessage(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('content') content: string) {
    return this.chatService.editMessage(id, userId, content);
  }

  @Delete('messages/:id')
  deleteMessage(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.chatService.deleteMessage(id, userId);
  }

  @Post('messages/:id/reactions')
  addReaction(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('emoji') emoji: string) {
    return this.chatService.addReaction(id, userId, emoji);
  }

  @Delete('messages/:id/reactions')
  removeReaction(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('emoji') emoji: string) {
    return this.chatService.removeReaction(id, userId, emoji);
  }

  @Patch('conversations/:id/read')
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.chatService.markRead(id, userId);
  }
}
