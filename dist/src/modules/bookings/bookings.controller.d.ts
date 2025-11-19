import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    create(createBookingDto: CreateBookingDto): Promise<{
        id: string;
        customerId: string;
        service: string;
        createdAt: Date;
        updatedAt: Date;
        dateTime: Date;
        status: string;
    }>;
    findAll(): Promise<{
        bookings: ({
            customer: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                whatsappId: string | null;
                instagramId: string | null;
                phone: string | null;
            };
        } & {
            id: string;
            customerId: string;
            service: string;
            createdAt: Date;
            updatedAt: Date;
            dateTime: Date;
            status: string;
        })[];
        total: number;
    }>;
    getServices(): {
        name: string;
        duration: number;
    }[];
    findByCustomer(customerId: string): Promise<{
        bookings: ({
            customer: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                whatsappId: string | null;
                instagramId: string | null;
                phone: string | null;
            };
        } & {
            id: string;
            customerId: string;
            service: string;
            createdAt: Date;
            updatedAt: Date;
            dateTime: Date;
            status: string;
        })[];
        total: number;
    }>;
    confirm(id: string): Promise<{
        id: string;
        customerId: string;
        service: string;
        createdAt: Date;
        updatedAt: Date;
        dateTime: Date;
        status: string;
    }>;
    cancel(id: string): Promise<{
        id: string;
        customerId: string;
        service: string;
        createdAt: Date;
        updatedAt: Date;
        dateTime: Date;
        status: string;
    }>;
}
