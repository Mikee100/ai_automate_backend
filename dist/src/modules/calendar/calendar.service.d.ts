import { PrismaService } from '../../prisma/prisma.service';
export declare class CalendarService {
    private prisma;
    private readonly services;
    constructor(prisma: PrismaService);
    getAvailableSlots(date: Date, service?: string): Promise<any[]>;
    syncCalendar(): Promise<void>;
}
