import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';
import { BullModule } from '@nestjs/bull';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        PrismaModule,
        MessagesModule,
        BullModule.registerQueue({ name: 'aiQueue' }),
    ],
    providers: [CronService],
    exports: [CronService],
})
export class CronModule { }
