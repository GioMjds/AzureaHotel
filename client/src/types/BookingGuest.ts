export interface BookingDataProps {
    bookingId?: string | null;
}

export interface FormattedBooking {
    roomType: string;
    imageUrl: string;
    dates: string;
    guests: number;
    price: number;
    status: string;
    bookingId: string | number;
    phoneNumber?: string;
    isVenueBooking?: boolean;
    roomDetails?: {
        room_image?: string;
        capacity?: number;
    };
    areaDetails?: {
        area_image?: string;
        area_name?: string;
        price_per_hour?: string;
        capacity?: number;
    };
    userDetails?: {
        fullName: string;
        email: string;
        phoneNumber?: string;
    };
    specialRequest?: string;
    validId?: string;
    bookingDate?: string;
    cancellationReason?: string;
    cancellationDate?: string;
    totalPrice?: number;
    numberOfGuests?: number;
    arrivalTime?: string;
    paymentMethod?: string;
    paymentProof?: string;
    downPayment?: number;
    originalPrice?: number;
    originalPriceFormatted?: string;
    discountPercent?: number;
    discountedPrice?: number;
    discountedPriceFormatted?: string;
    downPaymentFormatted?: string;
}

export interface RoomData {
    id: string;
    room_name: string;
    images: {
        id: string;
        room_image: string;
    }[];
    room_price: number;
    max_guests: number;
}

export interface AreaData {
    id: string;
    area_name: string;
    images?: {
        id: string;
        area_image: string;
    }[];
    price_per_hour: string;
    capacity: number;
}

export interface BookingDataTypes {
    id: string | number;
    check_in_date: string;
    check_out_date: string;
    status: string;
    room?: RoomData;
    area?: AreaData;
    room_details?: RoomData;
    area_details?: AreaData;
    is_venue_booking?: boolean;
    total_price?: number;
    phone_number?: string;
    user?: {
        first_name: string;
        last_name: string;
        email: string;
        phone_number?: string;
    };
    special_request?: string;
    valid_id?: string;
    created_at: string;
    cancellation_reason?: string;
    cancellation_date?: string;
    number_of_guests?: number;
    time_of_arrival?: string;
    payment_method?: string;
    payment_proof?: string;
    down_payment?: number;
}

export interface BookingCardProps {
    roomType: string;
    imageUrl: string;
    dates: string;
    guests: number;
    price: number;
    status: string;
    roomDetails?: {
        room_image?: string;
        capacity?: number;
    };
    areaDetails?: {
        area_image?: string;
        area_name?: string;
        price_per_hour?: string;
        capacity?: number;
    };
    userDetails?: {
        fullName: string;
        email: string;
        phoneNumber?: string;
    };
    specialRequest?: string;
    validId?: string;
    bookingDate?: string;
    cancellationReason?: string;
    cancellationDate?: string;
    totalPrice?: number;
    numberOfGuests?: number;
    arrivalTime?: string;
    paymentProof?: string;
    downPayment?: number;
}
