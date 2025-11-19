import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { MessagesModule } from '../modules/messages/messages.module';

@Module({
  imports: [MessagesModule],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
