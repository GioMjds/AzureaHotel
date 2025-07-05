import { BookingFormData } from "../types/BookingClient";

export const VALID_ID_CHOICES: [string, string][] = [
    ['passport',          'Passport'],
    ['driver_license',    "Driver's License"],
    ['national_id',       'National ID'],
    ['sss_id',            'SSS ID'],
    ['umid',              'Unified Multi-Purpose ID (UMID)'],
    ['philhealth_id',     'PhilHealth ID'],
    ['prc_id',            'PRC ID'],
    ['student_id',        'Student ID'],
    ['senior_citizen_id', 'Senior Citizen ID'],
    ['other',             'Other Government-Issued ID'],
];

export const createBookingFormData = (bookingData: BookingFormData) => {
    const formData = new FormData();
    Object.entries(bookingData).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value);
    });
    
    return formData;
};

export function getValidIdLabel(key: string | undefined | null): string {
    if (!key) return '';
    const match = VALID_ID_CHOICES.find(([value]) => value === key);
    return match ? match[1] : key;
}