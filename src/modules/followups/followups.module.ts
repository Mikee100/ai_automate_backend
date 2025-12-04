import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FollowupsService } from './followups.service';
import { FollowupsController } from './followups.controller';
import { BookingFollowupsListener } from './listeners/booking-followups.listener';
import { PrismaModule } from '../../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
    imports: [
        PrismaModule,
        WhatsappModule,
        BullModule.registerQueue({
            name: 'followupsQueue',
        }),
    ],
    controllers: [FollowupsController],
    providers: [FollowupsService, BookingFollowupsListener],
    exports: [FollowupsService],
})
export class FollowupsModule { }

