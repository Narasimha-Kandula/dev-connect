import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { SendMessageDto, CreateConversationDto, CreateGroupDto, EditMessageDto, ReactionDto, AddMembersDto } from './dto/chat.dto';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

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
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const saved = await this.chatService.sendMessage(id, userId, dto.content, dto.attachments);
    const payload = { ...saved };
    this.chatGateway.emitToConversation(id, 'message:new', payload);
    const members = await this.chatService.getConversationMembers(id);
    for (const member of members) {
      if (member.userId !== userId) {
        this.chatGateway.emitToUser(member.userId, 'message:new', payload);
      }
    }
    return saved;
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

  @Post('conversations/:id/members')
  async addMembers(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AddMembersDto,
  ) {
    const updated = await this.chatService.addMembers(id, userId, dto.memberIds);
    if (updated) {
      this.chatGateway.emitToConversation(id, 'conversation:members:updated', updated);
      for (const member of updated.members) {
        this.chatGateway.emitToUser(member.userId, 'conversation:members:updated', updated);
      }
    }
    return updated;
  }

  @Delete('conversations/:id')
  deleteConversation(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.chatService.deleteConversation(id, userId);
  }
}
