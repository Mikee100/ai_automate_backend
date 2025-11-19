import { BullModule } from '@nestjs/bull';

export const MessageQueue = BullModule.registerQueue({
  name: 'messageQueue',
});
