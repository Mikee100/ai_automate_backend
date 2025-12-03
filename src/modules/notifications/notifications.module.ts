import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationListener } from './listeners/notification.listener';

@Module({
    imports: [PrismaModule],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationListener],
    exports: [NotificationsService],
})
export class NotificationsModule { }
