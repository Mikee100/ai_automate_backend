import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
export declare class BookingsService {
    private prisma;
    private bookingQueue;
    private readonly services;
    constructor(prisma: PrismaService, bookingQueue: Queue);
    getBookingDraft(customerId: string): Promise<{
        id: string;
        customerId: string;
        service: string | null;
        date: Date | null;
        time: string | null;
        name: string | null;
        step: string;
        version: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createBookingDraft(customerId: string): Promise<{
        id: string;
        customerId: string;
        service: string | null;
        date: Date | null;
        time: string | null;
        name: string | null;
        step: string;
        version: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateBookingDraft(customerId: string, updates: Partial<{
        service: string;
        date: Date;
        time: string;
        name: string;
        step: string;
    }>): Promise<{
        id: string;
        customerId: string;
        service: string | null;
        date: Date | null;
        time: string | null;
        name: string | null;
        step: string;
        version: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteBookingDraft(customerId: string): Promise<{
        id: string;
        customerId: string;
        service: string | null;
        date: Date | null;
        time: string | null;
        name: string | null;
        step: string;
        version: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    completeBookingDraft(customerId: string): Promise<{
        id: string;
        customerId: string;
        service: string;
        createdAt: Date;
        updatedAt: Date;
        dateTime: Date;
        status: string;
    }>;
    getServices(): {
        name: string;
        duration: number;
    }[];
    createBooking(customerId: string, message?: string, service?: string, dateTime?: Date): Promise<{
        id: string;
        customerId: string;
        service: string;
        createdAt: Date;
        updatedAt: Date;
        dateTime: Date;
        status: string;
    }>;
    updateBooking(bookingId: string, updates: {
        service?: string;
        dateTime?: Date;
    }): Promise<{
        id: string;
        customerId: string;
        service: string;
        createdAt: Date;
        updatedAt: Date;
        dateTime: Date;
        status: string;
    }>;
    confirmBooking(bookingId: string): Promise<{
        id: string;
        customerId: string;
        service: string;
        createdAt: Date;
        updatedAt: Date;
        dateTime: Date;
        status: string;
    }>;
    cancelBooking(bookingId: string): Promise<{
        id: string;
        customerId: string;
        service: string;
        createdAt: Date;
        updatedAt: Date;
        dateTime: Date;
        status: string;
    }>;
    getBookings(customerId?: string): Promise<{
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
    createBookingFromMessage(message: any): Promise<void>;
    checkAvailability(dateTime: Date, service?: string): Promise<{
        available: boolean;
        suggestions?: Date[];
    }>;
    getAvailableSlotsForDate(date: string): Promise<Date[]>;
}
