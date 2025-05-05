export interface BookingResponse {
    id: number;
    user: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        profile_image?: string;
        address?: string;
        phone_number?: string;
    };
    room_details?: {
        id: number;
        room_name: string;
        room_type: string;
        room_price: string;
        room_image?: string;
        description?: string;
        capacity?: number;
        amenities?: Array<{
            id: number;
            description: string;
        }>;
    };
    area_details?: {
        id: number;
        area_name: string;
        area_image?: string;
        description?: string;
        price_per_hour?: string;
        capacity?: number;
        status?: string;
    };
    is_venue_booking?: boolean;
    total_price?: string | number;
    check_in_date: string;
    check_out_date: string;
    status: string;
    created_at: string;
    updated_at: string;
    cancellation_reason?: string;
    valid_id?: string;
    time_of_arrival?: string;
}

export interface BookingFormData {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address?: string;
    specialRequests?: string;
    validId: File | null;
    roomId: string | null;
    checkIn: string | null;
    checkOut: string | null;
    status?: "pending" | "confirmed" | "cancelled" | "checked_in" | "checked_out";
    totalPrice?: number;
    arrivalTime: string;
    numberOfGuests?: number;
    paymentMethod?: 'physical' | 'gcash';
    paymentProof?: File | null;
}

export interface ReservationFormData {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    emailAddress?: string;
    address?: string;
    specialRequests?: string;
    validId: File | null;
    areaId: string | null;
    startTime: string | null;
    endTime: string | null;
    totalPrice: number;
    status?: "pending" | "confirmed" | "cancelled";
    isVenueBooking?: boolean;
    numberOfGuests?: number;
    paymentMethod?: 'physical' | 'gcash';
    paymentProof?: File | null;
}

export interface AreaData {
    id: number;
    area_name: string;
    description: string;
    area_image: string;
    status: string;
    capacity: number;
    price_per_hour: string;
}

export interface FormData {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    emailAddress: string;
    validId: FileList;
    specialRequests: string;
    numberOfGuests: number;
    paymentMethod: 'physical' | 'gcash';
}

export interface AmenityObject {
    id: number;
    description: string;
}

export interface RoomData {
    id: number;
    room_name: string;
    room_type: string;
    room_price?: string;
    description: string;
    room_image: string;
    status: string;
    max_guests: number;
    amenities?: Amenity[];
    price_per_night?: string;
}

export interface BookingData {
    id: number;
    check_in_date: string;
    check_out_date: string;
    status: string;
}

export interface Amenity {
    id: number;
    description: string;
}

export interface AreaData {
    id: number;
    area_name: string;
    description: string;
    area_image: string;
    status: string;
    capacity: number;
    price_per_hour: string;
}

export interface BookingData {
    id: number;
    check_in_date: string;
    check_out_date: string;
    status: string;
    start_time: string | null;
    end_time: string | null;
}

export interface UnavailableTime {
    start_time: string;
    end_time: string;
    status: string;
}

export interface BookingsByDate {
    [date: string]: {
        status: string;
        bookingId: number;
        unavailableTimes?: UnavailableTime[];
    };
}

export interface ConfirmBookingFormValues {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    numberOfGuests: number;
    validId: FileList;
    arrivalTime: string;
    specialRequests: string;
    paymentMethod: 'physical' | 'gcash';
    paymentProof?: File | null;
}