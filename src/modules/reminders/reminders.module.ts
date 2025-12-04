import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { BookingRemindersListener } from './listeners/booking-reminders.listener';
import { PrismaModule } from '../../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
    imports: [
        PrismaModule,
        WhatsappModule,
        BullModule.registerQueue({
            name: 'remindersQueue',
        }),
    ],
    controllers: [RemindersController],
    providers: [RemindersService, BookingRemindersListener],
    exports: [RemindersService],
})
export class RemindersModule { }

