import { Job } from 'bullmq';
import { BookingsService } from '../src/modules/bookings/bookings.service';
export declare class BookingQueueProcessor {
    private bookingsService;
    constructor(bookingsService: BookingsService);
    process(job: Job<any>): Promise<any>;
}
