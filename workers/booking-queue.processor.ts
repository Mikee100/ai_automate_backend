import { Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { BookingsService } from '../src/modules/bookings/bookings.service';

@Injectable()
@Processor('bookingQueue')
export class BookingQueueProcessor {
  constructor(private bookingsService: BookingsService) {}

  async process(job: Job<any>): Promise<any> {
    const { bookingId } = job.data;
    // Logic to confirm booking, e.g., send confirmation message
    await this.bookingsService.confirmBooking(bookingId);
    return { confirmed: true };
  }
}
