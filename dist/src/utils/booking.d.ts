export declare function formatPhoneNumber(phone: string): string;
export declare function normalizeExtractedDateTime(extracted: {
    date?: string;
    time?: string;
}): {
    dateObj: Date;
    isoDate: string;
    dateOnly: string;
    timeOnly: string;
} | null;
