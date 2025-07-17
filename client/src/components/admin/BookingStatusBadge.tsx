import { FC } from "react";
import { BookingStatus } from "../../types/BookingsAdmin";

const BookingStatusBadge: FC<{ status: string }> = ({ status }) => {
    let bgColor = "";

    switch (status.toLowerCase()) {
        case BookingStatus.PENDING:
            bgColor = "bg-yellow-100 text-yellow-800";
            break;
        case BookingStatus.RESERVED:
            bgColor = "bg-green-100 text-green-800";
            break;
        case BookingStatus.CONFIRMED:
            bgColor = "bg-green-100 text-green-800";
            break;
        case BookingStatus.CHECKED_IN:
            bgColor = "bg-blue-100 text-blue-800";
            break;
        case BookingStatus.CHECKED_OUT:
            bgColor = "bg-gray-100 text-gray-800";
            break;
        case BookingStatus.CANCELLED:
            bgColor = "bg-red-100 text-red-800";
            break;
        case BookingStatus.REJECTED:
            bgColor = "bg-red-100 text-red-800";
            break;
        case BookingStatus.NO_SHOW:
            bgColor = "bg-purple-100 text-purple-800";
            break;
        default:
            bgColor = "bg-gray-100 text-gray-800";
    }

    return (
        <span className={`px-2 py-1 rounded-full text-md font-semibold uppercase ${bgColor}`}>
            {status.replace("_", " ")}
        </span>
    );
};

export default BookingStatusBadge;