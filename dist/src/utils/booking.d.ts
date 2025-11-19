export declare function normalizeExtractedDateTime(extracted: {
    date?: string;
    time?: string;
}, referenceDate?: Date, timezone?: string): {
    dateObj: Date;
    isoDate: string;
    dateOnly: string;
    timeOnly: string;
};
