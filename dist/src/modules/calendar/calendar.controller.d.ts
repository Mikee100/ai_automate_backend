import { CalendarService } from './calendar.service';
export declare class CalendarController {
    private readonly calendarService;
    constructor(calendarService: CalendarService);
    getAvailableSlots(date: string, service?: string): Promise<any[]>;
    syncCalendar(): Promise<void>;
}
