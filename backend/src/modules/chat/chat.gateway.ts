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
import { Logger, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
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

    this.logger.log(`Client connected: ${userId} (socket: ${client.id})`);
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

  @SubscribeMessage('conversation:join')
  async onJoin(@ConnectedSocket() client: AuthedSocket, @MessageBody() conversationId: string) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Unauthorized' };

    const isMember = await this.chatService.isMember(conversationId, userId);
    if (!isMember) return { error: 'Not a member of this conversation' };

    client.join(`conversation:${conversationId}`);
    this.trackConversationJoin(userId, conversationId);
    this.logger.debug(`User ${userId} joined conversation ${conversationId}`);
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
    @MessageBody() data: { conversationId: string; content: string; attachments?: { url: string; type: string; name: string }[] },
  ) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Unauthorized' };

    const tempId = randomUUID();
    const optimisticMessage = {
      id: tempId,
      conversationId: data.conversationId,
      senderId: userId,
      content: data.content,
      attachments: data.attachments ?? null,
      createdAt: new Date().toISOString(),
      sender: { profile: { displayName: '', avatarUrl: null } },
      reactions: [],
    };

    client.to(`conversation:${data.conversationId}`).emit('message:new', optimisticMessage);

    try {
      const saved = await this.chatService.sendMessage(data.conversationId, userId, data.content, data.attachments);
      if (saved.id !== tempId) {
        client.to(`conversation:${data.conversationId}`).emit('message:updated', saved);
      }
      return saved;
    } catch (e) {
      client.to(`conversation:${data.conversationId}`).emit('message:deleted', { messageId: tempId });
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
    const message = await this.chatService.editMessage(data.messageId, userId, data.content);
    client.to(`conversation:${message.conversationId}`).emit('message:updated', message);
    return message;
  }

  @SubscribeMessage('message:delete')
  async onDelete(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { messageId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Unauthorized' };
    const message = await this.chatService.deleteMessage(data.messageId, userId);
    client.to(`conversation:${message.conversationId}`).emit('message:deleted', { messageId: data.messageId });
    return { success: true };
  }

  @SubscribeMessage('message:react')
  async onReact(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { messageId: string; emoji: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Unauthorized' };
    const reaction = await this.chatService.addReaction(data.messageId, userId, data.emoji);
    const message = await this.chatService.getMessageById(data.messageId);
    if (message) {
      client.to(`conversation:${message.conversationId}`).emit('message:reaction', { messageId: data.messageId, userId, emoji: data.emoji });
    }
    return reaction;
  }

  @SubscribeMessage('typing')
  onTyping(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;
    if (!userId) return;
    client.to(`conversation:${data.conversationId}`).emit('typing', {
      userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('presence:check')
  onPresenceCheck(@ConnectedSocket() client: AuthedSocket, @MessageBody() data: { userIds: string[] }) {
    const onlineUsers = data.userIds.filter((id) => this.isUserOnline(id));
    return { onlineUsers };
  }
}
