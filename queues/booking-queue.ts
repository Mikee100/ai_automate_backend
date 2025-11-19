import { BullModule } from '@nestjs/bull';

export const BookingQueue = BullModule.registerQueue({
  name: 'bookingQueue',
});
