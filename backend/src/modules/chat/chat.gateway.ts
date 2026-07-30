import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger, Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/redis/redis.module';
import { checkWsRateLimit } from '../../common/guards/ws-rate-limiter';
import { ChatService } from './chat.service';

interface AuthedSocket extends Socket {
  data: { userId?: string };
}

@Injectable()
@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? '*', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private userConversationRooms = new Map<string, Set<string>>(); // userId -> Set of conversationIds

  constructor(
    private jwt: JwtService,
    private chatService: ChatService,
    @Inject(REDIS_CLIENT) private redis: Redis | null,
  ) {}

  afterInit(server: Server) {
    server.use(async (socket: AuthedSocket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
          return next(new Error('Authentication error: no token'));
        }
        const payload = await this.jwt.verifyAsync(token as string);
        socket.data.userId = payload.sub;
        next();
      } catch {
        next(new Error('Authentication error: invalid token'));
      }
    });
    this.logger.log('Chat WebSocket Gateway initialized with auth middleware');
  }

  handleConnection(client: AuthedSocket) {
    const userId = client.data.userId!;
    if (!userId) {
      client.disconnect();
      return;
    }

    // Track user socket
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    // Join user's personal room for direct notifications
    client.join(`user:${userId}`);

    // Broadcast user online status
    this.server.emit('user:online', { userId });

    // Update presence in Redis
    this.updateRedisPresence(userId, 'online').catch(() => {});

    // Send current online users to the newly connected client
    const onlineUserIds = Array.from(this.userSockets.keys()).filter((id) => id !== userId);
    client.emit('presence:sync', { onlineUsers: onlineUserIds });

    // Deliver any undelivered messages
    this.deliverUndeliveredMessages(userId).catch((e) => {
      this.logger.error(`Failed to deliver offline messages for ${userId}: ${(e as Error).message}`);
    });

    this.logger.log(`Client connected: ${userId} (socket: ${client.id})`);
  }

  private async updateRedisPresence(userId: string, status: string) {
    if (!this.redis) return;
    const key = `presence:${userId}`;
    await this.redis.set(key, status, 'EX', 60);
  }

  private async deliverUndeliveredMessages(userId: string) {
    const undelivered = await this.chatService.getUndeliveredMessages(userId);
    for (const msg of undelivered) {
      this.server.to(`user:${userId}`).emit('message:new', msg);
      await this.chatService.markDelivered(msg.id);
    }
    if (undelivered.length > 0) {
      this.logger.log(`Delivered ${undelivered.length} offline messages to ${userId}`);
    }
  }

  handleDisconnect(client: AuthedSocket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
          // Broadcast user offline status
          this.server.emit('user:offline', { userId });
          // Update presence in Redis with stale timeout
          this.updateRedisPresence(userId, 'away').catch(() => {});
        }
      }

      // Leave all conversation rooms
      const rooms = this.userConversationRooms.get(userId);
      if (rooms) {
        rooms.forEach((convId) => client.leave(`conversation:${convId}`));
        this.userConversationRooms.delete(userId);
      }

      this.logger.log(`Client disconnected: ${userId} (socket: ${client.id})`);
    }
  }

  private trackConversationJoin(userId: string, conversationId: string) {
    if (!this.userConversationRooms.has(userId)) {
      this.userConversationRooms.set(userId, new Set());
    }
    this.userConversationRooms.get(userId)!.add(conversationId);
  }

  private trackConversationLeave(userId: string, conversationId: string) {
    const rooms = this.userConversationRooms.get(userId);
    if (rooms) {
      rooms.delete(conversationId);
      if (rooms.size === 0) {
        this.userConversationRooms.delete(userId);
      }
    }
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: unknown): void {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  @SubscribeMessage('conversation:join')
  async onJoin(@ConnectedSocket() client: AuthedSocket, @MessageBody() conversationId: string) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Unauthorized' };

    const isMember = await this.chatService.isMember(conversationId, userId);
    if (!isMember) {
      this.logger.warn(`User ${userId} tried to join non-member conversation ${conversationId}`);
      return { error: 'Not a member of this conversation' };
    }

    const room = `conversation:${conversationId}`;
    client.join(room);
    this.trackConversationJoin(userId, conversationId);
    this.logger.debug(`JOINED ROOM: ${room} | USER: ${userId} | SOCKET: ${client.id}`);
    return { success: true };
  }

  @SubscribeMessage('conversation:leave')
  onLeave(@ConnectedSocket() client: AuthedSocket, @MessageBody() conversationId: string) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Unauthorized' };

    client.leave(`conversation:${conversationId}`);
    this.trackConversationLeave(userId, conversationId);
    return { success: true };
  }

  @SubscribeMessage('message:send')
  async onMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { conversationId: string; content: string; tempId?: string; attachments?: { url: string; type: string; name: string }[] },
  ) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Unauthorized' };
    if ((!data.content || !data.content.trim()) && (!data.attachments || data.attachments.length === 0)) return { error: 'Message content or attachment required' };
    if (data.content && data.content.length > 10000) return { error: 'Content too long' };

    const rateCheck = await checkWsRateLimit(this.redis, userId, 'message:send');
    if (!rateCheck.allowed) return { error: 'Rate limit exceeded. Please slow down.' };

    try {
      const saved = await this.chatService.sendMessage(data.conversationId, userId, data.content, data.attachments);
      const payload = { ...saved, tempId: data.tempId };
      const room = `conversation:${data.conversationId}`;
      this.logger.debug(`MESSAGE SAVED: ${saved.id} | EMITTING TO ROOM: ${room} | CONTENT: ${data.content?.slice(0, 50)}`);
      this.server.to(room).emit('message:new', payload);
      // Also emit to each member's user room for cross-page delivery
      const members = await this.chatService.getConversationMembers(data.conversationId);
      for (const member of members) {
        if (member.userId !== userId) {
          this.logger.debug(`EMITTING to user room: user:${member.userId}`);
          this.server.to(`user:${member.userId}`).emit('message:new', payload);
        }
      }
      return saved;
    } catch (e) {
      this.logger.error(`Failed to send message: ${(e as Error).message}`);
      return { error: (e as Error).message };
    }
  }

  @SubscribeMessage('message:edit')
  async onEdit(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { messageId: string; content: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Unauthorized' };
    if (!data.content || data.content.length > 10000) return { error: 'Invalid content length' };

    const rateCheck = await checkWsRateLimit(this.redis, userId, 'message:edit');
    if (!rateCheck.allowed) return { error: 'Rate limit exceeded' };
    const meta = await this.chatService.getMessageById(data.messageId);
    if (!meta) return { error: 'Message not found' };
    const isMember = await this.chatService.isMember(meta.conversationId, userId);
    if (!isMember) return { error: 'Not a member of this conversation' };
    const message = await this.chatService.editMessage(data.messageId, userId, data.content);
    this.server.to(`conversation:${meta.conversationId}`).emit('message:updated', message);
    return message;
  }

  @SubscribeMessage('message:delete')
  async onDelete(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { messageId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Unauthorized' };

    const rateCheck = await checkWsRateLimit(this.redis, userId, 'message:delete');
    if (!rateCheck.allowed) return { error: 'Rate limit exceeded' };

    const meta = await this.chatService.getMessageById(data.messageId);
    if (!meta) return { error: 'Message not found' };
    const isMember = await this.chatService.isMember(meta.conversationId, userId);
    if (!isMember) return { error: 'Not a member of this conversation' };
    await this.chatService.deleteMessage(data.messageId, userId);
    this.server.to(`conversation:${meta.conversationId}`).emit('message:deleted', { messageId: data.messageId });
    return { success: true };
  }

  @SubscribeMessage('message:react')
  async onReact(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { messageId: string; emoji: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Unauthorized' };

    const rateCheck = await checkWsRateLimit(this.redis, userId, 'message:react');
    if (!rateCheck.allowed) return { error: 'Rate limit exceeded' };
    const reaction = await this.chatService.addReaction(data.messageId, userId, data.emoji);
    const message = await this.chatService.getMessageById(data.messageId);
    if (message) {
      this.server.to(`conversation:${message.conversationId}`).emit('message:reaction', { messageId: data.messageId, userId, emoji: data.emoji });
    }
    return reaction;
  }

  @SubscribeMessage('typing')
  async onTyping(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const rateCheck = await checkWsRateLimit(this.redis, userId, 'typing');
    if (!rateCheck.allowed) return;
    client.to(`conversation:${data.conversationId}`).emit('typing', {
      userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('conversation:read')
  async onRead(@ConnectedSocket() client: AuthedSocket, @MessageBody() conversationId: string) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Unauthorized' };

    await this.chatService.markRead(conversationId, userId);
    client.to(`conversation:${conversationId}`).emit('message:read', { conversationId, userId });
    return { success: true };
  }

  @SubscribeMessage('presence:check')
  onPresenceCheck(@ConnectedSocket() client: AuthedSocket, @MessageBody() data: { userIds: string[] }) {
    const onlineUsers = data.userIds.filter((id) => this.isUserOnline(id));
    return { onlineUsers };
  }
}
