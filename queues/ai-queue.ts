import { BullModule } from '@nestjs/bull';

export const AiQueue = BullModule.registerQueue({
  name: 'aiQueue',
});
