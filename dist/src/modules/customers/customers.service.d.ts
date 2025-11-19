import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
export declare class CustomersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createCustomerDto: CreateCustomerDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        whatsappId: string | null;
        instagramId: string | null;
        phone: string | null;
    }>;
    findAll(): Promise<({
        messages: {
            id: string;
            customerId: string;
            createdAt: Date;
            content: string;
            platform: string;
            direction: string;
            externalId: string | null;
        }[];
        bookings: {
            id: string;
            customerId: string;
            service: string;
            createdAt: Date;
            updatedAt: Date;
            dateTime: Date;
            status: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        whatsappId: string | null;
        instagramId: string | null;
        phone: string | null;
    })[]>;
    findOne(id: string): Promise<{
        messages: {
            id: string;
            customerId: string;
            createdAt: Date;
            content: string;
            platform: string;
            direction: string;
            externalId: string | null;
        }[];
        bookings: {
            id: string;
            customerId: string;
            service: string;
            createdAt: Date;
            updatedAt: Date;
            dateTime: Date;
            status: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        whatsappId: string | null;
        instagramId: string | null;
        phone: string | null;
    }>;
    findByEmail(email: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        whatsappId: string | null;
        instagramId: string | null;
        phone: string | null;
    }>;
    findByWhatsappId(whatsappId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        whatsappId: string | null;
        instagramId: string | null;
        phone: string | null;
    }>;
    findByInstagramId(instagramId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        whatsappId: string | null;
        instagramId: string | null;
        phone: string | null;
    }>;
    update(id: string, updateCustomerDto: Partial<CreateCustomerDto>): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        whatsappId: string | null;
        instagramId: string | null;
        phone: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        whatsappId: string | null;
        instagramId: string | null;
        phone: string | null;
    }>;
}
