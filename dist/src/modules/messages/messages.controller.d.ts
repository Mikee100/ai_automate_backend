import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    create(createMessageDto: CreateMessageDto): Promise<{
        id: string;
        content: string;
        platform: string;
        direction: string;
        externalId: string | null;
        createdAt: Date;
        customerId: string;
    }>;
    findAll(): Promise<({
        customer: {
            id: string;
            createdAt: Date;
            name: string;
            email: string;
            phone: string | null;
            whatsappId: string | null;
            instagramId: string | null;
            updatedAt: Date;
        };
    } & {
        id: string;
        content: string;
        platform: string;
        direction: string;
        externalId: string | null;
        createdAt: Date;
        customerId: string;
    })[]>;
    findByCustomer(customerId: string): Promise<({
        customer: {
            id: string;
            createdAt: Date;
            name: string;
            email: string;
            phone: string | null;
            whatsappId: string | null;
            instagramId: string | null;
            updatedAt: Date;
        };
    } & {
        id: string;
        content: string;
        platform: string;
        direction: string;
        externalId: string | null;
        createdAt: Date;
        customerId: string;
    })[]>;
}
