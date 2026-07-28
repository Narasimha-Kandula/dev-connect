import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto, CreateConversationDto, CreateGroupDto, EditMessageDto, ReactionDto } from './dto/chat.dto';

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
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(id, userId, dto.content, dto.attachments);
  }

  @Post('conversations')
  createConversation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createOrGetConversation(userId, dto.targetUserId);
  }

  @Post('conversations/group')
  createGroup(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateGroupDto,
  ) {
    return this.chatService.createGroup(dto.name, userId, dto.memberIds);
  }

  @Patch('messages/:id')
  editMessage(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: EditMessageDto) {
    return this.chatService.editMessage(id, userId, dto.content);
  }

  @Delete('messages/:id')
  deleteMessage(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.chatService.deleteMessage(id, userId);
  }

  @Post('messages/:id/reactions')
  addReaction(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: ReactionDto) {
    return this.chatService.addReaction(id, userId, dto.emoji);
  }

  @Delete('messages/:id/reactions')
  removeReaction(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: ReactionDto) {
    return this.chatService.removeReaction(id, userId, dto.emoji);
  }

  @Patch('conversations/:id/read')
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.chatService.markRead(id, userId);
  }
}
