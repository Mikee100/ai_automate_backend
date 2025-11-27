import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { CronModule } from './modules/cron/cron.module';
import { CustomersModule } from './modules/customers/customers.module';
import { MessagesModule } from './modules/messages/messages.module';
import { AiModule } from './modules/ai/ai.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { InstagramModule } from './modules/instagram/instagram.module';
import { WorkersModule } from './workers/workers.module';
import { WebsocketModule } from './websockets/websocket.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { EscalationModule } from './modules/escalation/escalation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
    PrismaModule,
    AuthModule,
    BookingsModule,
    CustomersModule,
    MessagesModule,
    AiModule,
    WebhooksModule,
    CalendarModule,
    CronModule,
    WhatsappModule,
    InstagramModule,
    WorkersModule,
    WebsocketModule,
    AnalyticsModule,
    PaymentsModule,
    EscalationModule,
  ],
})
export class AppModule { }
