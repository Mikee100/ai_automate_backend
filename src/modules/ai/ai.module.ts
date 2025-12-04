import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiSettingsService } from './ai-settings.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { AdminAiController } from './admin-ai.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { BookingsModule } from '../bookings/bookings.module';
import { MessagesModule } from '../messages/messages.module';
import { CustomersModule } from '../customers/customers.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => BookingsModule),
    forwardRef(() => MessagesModule),
    CustomersModule,
    BullModule.registerQueue({
      name: 'aiQueue',
    }),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [AiController, AdminAiController],
  providers: [AiService, AiSettingsService, CircuitBreakerService],
  exports: [AiService, AiSettingsService],
})
export class AiModule { }
