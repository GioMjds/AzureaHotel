/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BookingFormData,
  BookingResponse,
  ReservationFormData,
} from "../types/BookingClient";
import { createBookingFormData } from "../utils/booking";
import { booking } from "./_axios";

export const fetchBookings = async (
  page: number,
  pageSize: number
): Promise<{
  data: BookingResponse[];
  pagination?: {
    total_pages: number;
    current_page: number;
    total_items: number;
    page_size: number;
  };
}> => {
  try {
    const response = await booking.get("/bookings", {
      params: {
        page,
        page_size: pageSize,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch bookings: ${error}`);
    throw error;
  }
};

export const fetchReservations = async () => {
  try {
    const response = await booking.get("/reservation", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch reservations: ${error}`);
    throw error;
  }
};

export const fetchAvailability = async (arrival: string, departure: string) => {
  try {
    const response = await booking.get("/availability", {
      params: {
        arrival,
        departure,
        exclude_statuses: "reserved,checked_in",
      },
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    if (response.data) {
      if (response.data.rooms) {
        response.data.rooms = response.data.rooms.filter(
          (room: any) =>
            !(room.status === "reserved" || room.status === "checked_in")
        );
      }

      if (response.data.areas) {
        response.data.areas = response.data.areas.filter(
          (area: any) =>
            !(area.status === "reserved" || area.status === "checked_in")
        );
      }
    }

    return response.data;
  } catch (error) {
    console.error(`Failed to fetch availability: ${error}`);
    throw error;
  }
};

export const createBooking = async (bookingData: BookingFormData) => {
  try {
    const formData = createBookingFormData(bookingData);

    const response = await booking.post("/bookings", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to create booking: ${error}`);
    throw error;
  }
};

export const createReservation = async (
  reservationData: ReservationFormData
) => {
  try {
    const formData = new FormData();

    formData.append("firstName", reservationData.firstName);
    formData.append("lastName", reservationData.lastName);
    formData.append("phoneNumber", reservationData.phoneNumber);
    formData.append("specialRequests", reservationData.specialRequests || "");
    formData.append("roomId", reservationData.areaId || "");
    formData.append("isVenueBooking", "true");
    formData.append("status", reservationData.status || "pending");

    if (reservationData.startTime) {
      const startDate = new Date(reservationData.startTime);
      const formattedStartDate = startDate.toISOString().split("T")[0];
      formData.append("checkIn", formattedStartDate);

      const hours = startDate.getHours().toString().padStart(2, "0");
      const minutes = startDate.getMinutes().toString().padStart(2, "0");
      formData.append("startTime", `${hours}:${minutes}`);
    }

    if (reservationData.endTime) {
      const endDate = new Date(reservationData.endTime);
      const formattedEndDate = endDate.toISOString().split("T")[0];
      formData.append("checkOut", formattedEndDate);

      const hours = endDate.getHours().toString().padStart(2, "0");
      const minutes = endDate.getMinutes().toString().padStart(2, "0");
      formData.append("endTime", `${hours}:${minutes}`);
    }

    formData.append(
      "totalPrice",
      reservationData.totalPrice?.toString() || "0"
    );

    if (reservationData.numberOfGuests !== undefined) {
      formData.append(
        "numberOfGuests",
        reservationData.numberOfGuests.toString()
      );
    }

    formData.append("paymentMethod", reservationData.paymentMethod);

    if (
      reservationData.paymentMethod === "gcash" &&
      reservationData.paymentProof
    ) {
      formData.append("paymentProof", reservationData.paymentProof);
    }

    const response = await booking.post("/bookings", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to create venue booking: ${error}`);
    throw error;
  }
};

export const fetchRoomById = async (roomId: string) => {
  try {
    const response = await booking.get(`/rooms/${roomId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch room details: ${error}`);
    throw error;
  }
};

export const fetchAreaById = async (areaId: string) => {
  try {
    const response = await booking.get(`/areas/${areaId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch area details: ${error}`);
    throw error;
  }
};

export const fetchBookingDetail = async (bookingId: number | string) => {
  try {
    const response = await booking.get(`/bookings/${bookingId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch booking details: ${error}`);
    throw error;
  }
};

export const fetchUserBookings = async ({
  page = 1,
  pageSize = 9,
}: {
  page?: number;
  pageSize?: number;
} = {}) => {
  try {
    const response = await booking.get("/user/bookings", {
      params: {
        page,
        page_size: pageSize,
      },
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch user bookings: ${error}`);
    throw error;
  }
};

export const cancelBooking = async (bookingId: string, reason: string) => {
  try {
    const response = await booking.post(
      `/bookings/${bookingId}/cancel`,
      { reason },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to cancel booking: ${error}`);
    throw error;
  }
};

export const fetchRoomBookings = async (
  roomId: string,
  startDate?: string,
  endDate?: string
) => {
  try {
    const url = `/rooms/${roomId}/bookings`;
    const params: Record<string, string> = {};

    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await booking.get(url, {
      params,
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to fetch room bookings: ${error}`);
    throw error;
  }
};

export const fetchAreaBookings = async (
  areaId: string,
  startDate?: string,
  endDate?: string
) => {
  try {
    const url = `/areas/${areaId}/bookings`;
    const params: Record<string, string> = {};

    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await booking.get(url, {
      params,
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to fetch area bookings: ${error}`);
    throw error;
  }
};

export const fetchReviews = async (bookingId: string) => {
  try {
    const response = await booking.get(`/bookings/${bookingId}/reviews`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch reviews: ${error}`);
    throw error;
  }
};

export const createReview = async (
  bookingId: string,
  reviewData: { review_text: string; rating: number }
) => {
  try {
    const response = await booking.post(
      `/bookings/${bookingId}/reviews`,
      reviewData,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to create review: ${error}`);
    throw error;
  }
};

export const fetchUserReviews = async () => {
  try {
    const response = await booking.get("/user/reviews", {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch user reviews: ${error}`);
    throw error;
  }
};

export const updateReview = async (
  reviewId: string,
  reviewData: { review_text?: string; rating?: number }
) => {
  try {
    const response = await booking.put(`/reviews/${reviewId}`, reviewData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to update review: ${error}`);
    throw error;
  }
};

export const deleteReview = async (reviewId: string) => {
  try {
    const response = await booking.delete(`/reviews/${reviewId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to delete review: ${error}`);
    throw error;
  }
};

export const fetchRoomReviews = async (
  roomId: string,
  page: number,
  pageSize: number
) => {
  try {
    const response = await booking.get(
      `/rooms/${roomId}/reviews?page=${page}&page_size=${pageSize}`,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch room reviews: ${error}`);
    throw error;
  }
};

export const fetchAreaReviews = async (
  areaId: string,
  page: number,
  pageSize: number
) => {
  try {
    const response = await booking.get(
      `/areas/${areaId}/reviews?page=${page}&page_size=${pageSize}`,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch area reviews: ${error}`);
    throw error;
  }
};

export const checkMaxDailyBookings = async () => {
  try {
    const response = await booking.get("/check-max-bookings/", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to check max bookings: ${error}`);
    throw error;
  }
};

export const getUserBookingsForToday = async () => {
  try {
    const response = await booking.get("/check-max-bookings/", {
      withCredentials: true,
    });
    return response;
  } catch (error) {
    console.error(`Failed to get user booking count: ${error}`);
    throw error;
  }
};

export const checkCanBookToday = async (): Promise<{
  canBook: boolean;
  message?: string;
}> => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return { canBook: true };
    }

    const response = await booking.get("/check-can-book-today/", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Error checking booking eligibility: ${error}`);
    return { canBook: true };
  }
};

export const generateCheckoutEReceipt = async (bookingId: string) => {
  try {
    const response = await booking.get(
      `/generate_checkout_e_receipt/${bookingId}`,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to generate checkout e-receipt: ${error}`);
    throw error;
  }
};
