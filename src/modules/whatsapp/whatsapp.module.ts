import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { MessagesModule } from '../messages/messages.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    forwardRef(() => MessagesModule),
    forwardRef(() => CustomersModule),
    BullModule.registerQueue({
      name: 'messageQueue',
    }),
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
