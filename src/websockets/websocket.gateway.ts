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
import { Injectable } from '@nestjs/common';
import { MessagesService } from '../modules/messages/messages.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { platform: string }, @ConnectedSocket() client: Socket) {
    client.join(data.platform);
    console.log(`Client ${client.id} joined ${data.platform}`);
  }

  // Method to emit new message to clients
  emitNewMessage(platform: string, message: any) {
    this.server.to(platform).emit('newMessage', message);
  }

  // Method to emit conversation updates
  emitConversationUpdate(platform: string, conversation: any) {
    this.server.to(platform).emit('conversationUpdate', conversation);
  }

  // Method to emit typing indicator
  emitTyping(platform: string, customerId: string, isTyping: boolean) {
    this.server.to(platform).emit('typing', { customerId, isTyping });
  }
}
