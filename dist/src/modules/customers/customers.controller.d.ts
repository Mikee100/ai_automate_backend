import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(createCustomerDto: CreateCustomerDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        whatsappId: string | null;
        instagramId: string | null;
        messengerId: string | null;
        phone: string | null;
        aiEnabled: boolean;
        isAiPaused: boolean;
    }>;
    findAll(): Promise<({
        messages: {
            id: string;
            createdAt: Date;
            content: string;
            platform: string;
            direction: string;
            externalId: string | null;
            handledBy: string | null;
            isResolved: boolean | null;
            isEscalated: boolean | null;
            customerId: string;
        }[];
        bookings: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            status: string;
            service: string;
            recipientName: string | null;
            recipientPhone: string | null;
            dateTime: Date;
            durationMinutes: number | null;
            googleEventId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        whatsappId: string | null;
        instagramId: string | null;
        messengerId: string | null;
        phone: string | null;
        aiEnabled: boolean;
        isAiPaused: boolean;
    })[]>;
    findOne(id: string): Promise<{
        messages: {
            id: string;
            createdAt: Date;
            content: string;
            platform: string;
            direction: string;
            externalId: string | null;
            handledBy: string | null;
            isResolved: boolean | null;
            isEscalated: boolean | null;
            customerId: string;
        }[];
        bookings: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            status: string;
            service: string;
            recipientName: string | null;
            recipientPhone: string | null;
            dateTime: Date;
            durationMinutes: number | null;
            googleEventId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        whatsappId: string | null;
        instagramId: string | null;
        messengerId: string | null;
        phone: string | null;
        aiEnabled: boolean;
        isAiPaused: boolean;
    }>;
    update(id: string, updateCustomerDto: Partial<CreateCustomerDto>): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        whatsappId: string | null;
        instagramId: string | null;
        messengerId: string | null;
        phone: string | null;
        aiEnabled: boolean;
        isAiPaused: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        whatsappId: string | null;
        instagramId: string | null;
        messengerId: string | null;
        phone: string | null;
        aiEnabled: boolean;
        isAiPaused: boolean;
    }>;
    toggleAi(id: string, enabled: boolean): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        whatsappId: string | null;
        instagramId: string | null;
        messengerId: string | null;
        phone: string | null;
        aiEnabled: boolean;
        isAiPaused: boolean;
    }>;
}
