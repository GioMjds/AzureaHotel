import { BookingResponse } from "./BookingClient";

export interface BookingQuery {
    data: BookingResponse[];
    pagination?: {
        total_pages: number;
        current_page: number;
        total_items: number;
        page_size: number;
    };
}

export enum BookingStatus {
    PENDING = "pending",
    RESERVED = "reserved",
    CONFIRMED = "confirmed",
    CHECKED_IN = "checked_in",
    CHECKED_OUT = "checked_out",
    CANCELLED = "cancelled",
    REJECTED = "rejected",
    NO_SHOW = "no_show"
}