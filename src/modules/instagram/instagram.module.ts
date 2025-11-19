import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { InstagramController } from './instagram.controller';
import { InstagramService } from './instagram.service';
import { MessagesModule } from '../messages/messages.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    MessagesModule,
    CustomersModule,
    BullModule.registerQueue({
      name: 'messageQueue',
    }),
  ],
  controllers: [InstagramController],
  providers: [InstagramService],
  exports: [InstagramService],
})
export class InstagramModule {}
