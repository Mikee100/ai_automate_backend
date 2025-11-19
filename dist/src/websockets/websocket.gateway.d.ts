import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../modules/messages/messages.service';
export declare class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private messagesService;
    server: Server;
    constructor(messagesService: MessagesService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoin(data: {
        platform: string;
    }, client: Socket): void;
    emitNewMessage(platform: string, message: any): void;
    emitConversationUpdate(platform: string, conversation: any): void;
    emitTyping(platform: string, customerId: string, isTyping: boolean): void;
}
