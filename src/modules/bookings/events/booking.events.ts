export class BookingDraftCompletedEvent {
    constructor(
        public readonly customerId: string,
        public readonly draftId: string,
        public readonly service: string,
        public readonly dateTime: Date,
        public readonly recipientPhone: string,
        public readonly depositAmount: number,
    ) { }
}

export class BookingCreatedEvent {
    constructor(
        public readonly bookingId: string,
        public readonly customerId: string,
        public readonly service: string,
        public readonly dateTime: Date,
        public readonly customerName: string,
    ) { }
}

export class BookingRescheduledEvent {
    constructor(
        public readonly bookingId: string,
        public readonly customerId: string,
        public readonly service: string,
        public readonly oldDateTime: Date,
        public readonly newDateTime: Date,
        public readonly customerName: string,
    ) { }
}

export class BookingCancelledEvent {
    constructor(
        public readonly bookingId: string,
        public readonly customerId: string,
        public readonly service: string,
        public readonly dateTime: Date,
    ) { }
}

export class BookingCompletedEvent {
    constructor(
        public readonly bookingId: string,
        public readonly customerId: string,
        public readonly service: string,
        public readonly completedAt: Date,
    ) { }
}

