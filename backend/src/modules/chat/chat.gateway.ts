import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

interface AuthedSocket extends Socket {
  data: { userId?: string };
}

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? '*', credentials: true },
  namespace: '/ws/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private jwt: JwtService,
    private chatService: ChatService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      const payload = await this.jwt.verifyAsync(token as string);
      client.data.userId = payload.sub;
      this.logger.log(`Client connected: ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthedSocket) {
    this.logger.log(`Client disconnected: ${client.data.userId ?? 'unknown'}`);
  }

  @SubscribeMessage('conversation:join')
  onJoin(@ConnectedSocket() client: AuthedSocket, @MessageBody() conversationId: string) {
    client.join(`conversation:${conversationId}`);
  }

  @SubscribeMessage('conversation:leave')
  onLeave(@ConnectedSocket() client: AuthedSocket, @MessageBody() conversationId: string) {
    client.leave(`conversation:${conversationId}`);
  }

  @SubscribeMessage('message:send')
  async onMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;
    const message = await this.chatService.sendMessage(data.conversationId, userId, data.content);
    this.server.to(`conversation:${data.conversationId}`).emit('message:new', message);
    return message;
  }

  @SubscribeMessage('typing')
  onTyping(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    client.to(`conversation:${data.conversationId}`).emit('typing', {
      userId: client.data.userId,
      isTyping: data.isTyping,
    });
  }
}
