import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { MessagesModule } from '../messages/messages.module';
import { CustomersModule } from '../customers/customers.module';
import { AiModule } from '../ai/ai.module';
import { BullModule } from '@nestjs/bull';
import { WebsocketModule } from '../../websockets/websocket.module';

@Module({
  imports: [
    MessagesModule,
    CustomersModule,
    AiModule,
    BullModule.registerQueue({
      name: 'messageQueue',
    }),
    WebsocketModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
