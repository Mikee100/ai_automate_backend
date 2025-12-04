import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MessageQueueProcessor } from '../../workers/message-queue.processor';
import { AiQueueProcessor } from '../../workers/ai-queue.processor';
import { BookingQueueProcessor } from '../../workers/booking-queue.processor';
import { RemindersQueueProcessor } from '../../workers/reminders-queue.processor';
import { FollowupsQueueProcessor } from '../../workers/followups-queue.processor';
import { MessagesModule } from '../modules/messages/messages.module';
import { AiModule } from '../modules/ai/ai.module';
import { BookingsModule } from '../modules/bookings/bookings.module';
import { RemindersModule } from '../modules/reminders/reminders.module';
import { FollowupsModule } from '../modules/followups/followups.module';
import { WhatsappModule } from '../modules/whatsapp/whatsapp.module';
import { InstagramModule } from '../modules/instagram/instagram.module';
import { CustomersModule } from '../modules/customers/customers.module';
import { WebsocketModule } from '../websockets/websocket.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'messageQueue',
    }),
    BullModule.registerQueue({
      name: 'aiQueue',
    }),
    BullModule.registerQueue({
      name: 'bookingQueue',
    }),
    BullModule.registerQueue({
      name: 'remindersQueue',
    }),
    BullModule.registerQueue({
      name: 'followupsQueue',
    }),
    MessagesModule,
    AiModule,
    BookingsModule,
    RemindersModule,
    FollowupsModule,
    WhatsappModule,
    InstagramModule,
    CustomersModule,
    WebsocketModule,
  ],
  providers: [
    MessageQueueProcessor,
    AiQueueProcessor,
    BookingQueueProcessor,
    RemindersQueueProcessor,
    FollowupsQueueProcessor,
  ],
})
export class WorkersModule { }

