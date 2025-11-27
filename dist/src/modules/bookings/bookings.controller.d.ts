import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    getBookingStatus(customerId: string): Promise<{
        status: string;
        booking: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            service: string;
            recipientName: string | null;
            recipientPhone: string | null;
            dateTime: Date;
            status: string;
            durationMinutes: number | null;
            googleEventId: string | null;
        };
    } | {
        status: string;
        booking?: undefined;
    }>;
    create(createBookingDto: CreateBookingDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        service: string;
        recipientName: string | null;
        recipientPhone: string | null;
        dateTime: Date;
        status: string;
        durationMinutes: number | null;
        googleEventId: string | null;
    }>;
    findAll(): Promise<{
        bookings: ({
            customer: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                phone: string | null;
                whatsappId: string | null;
                instagramId: string | null;
                messengerId: string | null;
                aiEnabled: boolean;
                isAiPaused: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            service: string;
            recipientName: string | null;
            recipientPhone: string | null;
            dateTime: Date;
            status: string;
            durationMinutes: number | null;
            googleEventId: string | null;
        })[];
        total: number;
    }>;
    getPackages(): Promise<{
        id: string;
        name: string;
        type: string;
        price: number;
        deposit: number;
        duration: string;
        images: number;
        makeup: boolean;
        outfits: number;
        styling: boolean;
        photobook: boolean;
        photobookSize: string | null;
        mount: boolean;
        balloonBackdrop: boolean;
        wig: boolean;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    createPackage(data: any): Promise<{
        id: string;
        name: string;
        type: string;
        price: number;
        deposit: number;
        duration: string;
        images: number;
        makeup: boolean;
        outfits: number;
        styling: boolean;
        photobook: boolean;
        photobookSize: string | null;
        mount: boolean;
        balloonBackdrop: boolean;
        wig: boolean;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePackage(id: string, data: any): Promise<{
        id: string;
        name: string;
        type: string;
        price: number;
        deposit: number;
        duration: string;
        images: number;
        makeup: boolean;
        outfits: number;
        styling: boolean;
        photobook: boolean;
        photobookSize: string | null;
        mount: boolean;
        balloonBackdrop: boolean;
        wig: boolean;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deletePackage(id: string): Promise<{
        id: string;
        name: string;
        type: string;
        price: number;
        deposit: number;
        duration: string;
        images: number;
        makeup: boolean;
        outfits: number;
        styling: boolean;
        photobook: boolean;
        photobookSize: string | null;
        mount: boolean;
        balloonBackdrop: boolean;
        wig: boolean;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getStudioInfo(): Promise<{
        id: string;
        notes: string;
        createdAt: Date;
        updatedAt: Date;
        location: string;
    }>;
    findByCustomer(customerId: string): Promise<{
        bookings: ({
            customer: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                phone: string | null;
                whatsappId: string | null;
                instagramId: string | null;
                messengerId: string | null;
                aiEnabled: boolean;
                isAiPaused: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            service: string;
            recipientName: string | null;
            recipientPhone: string | null;
            dateTime: Date;
            status: string;
            durationMinutes: number | null;
            googleEventId: string | null;
        })[];
        total: number;
    }>;
    confirm(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        service: string;
        recipientName: string | null;
        recipientPhone: string | null;
        dateTime: Date;
        status: string;
        durationMinutes: number | null;
        googleEventId: string | null;
    }>;
    cancel(id: string): Promise<{
        customer: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            whatsappId: string | null;
            instagramId: string | null;
            messengerId: string | null;
            aiEnabled: boolean;
            isAiPaused: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        service: string;
        recipientName: string | null;
        recipientPhone: string | null;
        dateTime: Date;
        status: string;
        durationMinutes: number | null;
        googleEventId: string | null;
    }>;
    completeDraft(customerId: string): Promise<{
        message: string;
        checkoutRequestId: string;
    }>;
    getAvailableHours(date: string, service?: string): Promise<{
        time: any;
        available: boolean;
    }[]>;
    updateDraft(customerId: string, updates: any): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        service: string | null;
        date: string | null;
        time: string | null;
        dateTimeIso: string | null;
        recipientName: string | null;
        recipientPhone: string | null;
        isForSomeoneElse: boolean | null;
        step: string;
        version: number;
    }>;
}
