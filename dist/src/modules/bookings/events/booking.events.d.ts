export declare class BookingDraftCompletedEvent {
    readonly customerId: string;
    readonly draftId: string;
    readonly service: string;
    readonly dateTime: Date;
    readonly recipientPhone: string;
    readonly depositAmount: number;
    constructor(customerId: string, draftId: string, service: string, dateTime: Date, recipientPhone: string, depositAmount: number);
}
export declare class BookingCreatedEvent {
    readonly bookingId: string;
    readonly customerId: string;
    readonly service: string;
    readonly dateTime: Date;
    readonly customerName: string;
    constructor(bookingId: string, customerId: string, service: string, dateTime: Date, customerName: string);
}
export declare class BookingRescheduledEvent {
    readonly bookingId: string;
    readonly customerId: string;
    readonly service: string;
    readonly oldDateTime: Date;
    readonly newDateTime: Date;
    readonly customerName: string;
    constructor(bookingId: string, customerId: string, service: string, oldDateTime: Date, newDateTime: Date, customerName: string);
}
export declare class BookingCancelledEvent {
    readonly bookingId: string;
    readonly customerId: string;
    readonly service: string;
    readonly dateTime: Date;
    constructor(bookingId: string, customerId: string, service: string, dateTime: Date);
}
