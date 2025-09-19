/* eslint-disable @typescript-eslint/no-explicit-any */
import { BookingResponse } from "../types/BookingClient";

export const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a number as a currency string (₱)
 */
export const formatCurrency = (value: number): string => {
  const abs = Math.abs(value);
  const basic = pesoFormatter.format(abs);
  return value < 0 ? `(${basic})` : basic;
};

/**
 * Format month and year from a date string
 */
export const formatMonthYear = (month: number, year: number) => {
  return new Date(year, month).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
};

/**
 * Get the number of days in a month
 */
export const getDaysInMonth = (
  month: number,
  year: number,
  adjustForDisplay?: boolean
) => {
  const adjustedMonth = month - 1;
  const date = new Date(year, adjustedMonth, 1);
  const days = [];
  while (date.getMonth() === adjustedMonth) {
    days.push(adjustForDisplay ? date.getDate() : new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

/**
 * Parse a price value from a formatted string (removes ₱ and commas)
 * @param price The price string or number to parse
 * @returns A numeric value
 */
export const parsePriceValue = (price: string | number): number => {
  if (typeof price === "number") return price;

  const numericString = price.replace(/[^\d.]/g, "");
  return parseFloat(numericString) || 0;
};

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  try {
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) {
    console.error(`Error formatting date: ${dateString}`, e);
    return dateString;
  }
};

/**
 * Format a date with time
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return "";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format a time string to a readable format
 */
export const getBookingPrice = (booking: BookingResponse): number => {
  const priceString = booking.total_price?.toString() || "0";
  const numericString = priceString.replace(/[^0-9.]/g, "");
  return parseFloat(numericString) || 0;
};

/**
 * Format a status string to a more readable format
 */
export const formatStatus = (status: string): string => {
  return status.toUpperCase().replace(/_/g, " ");
};

/**
 * Format a status color based on the status string
 */
export const getStatusColor = (status: string): string => {
  const normalizedStatus = status.toLowerCase().replace(/_/g, " ");
  switch (normalizedStatus) {
    case "confirmed":
      return "bg-green-50 text-green-700";
    case "pending":
      return "bg-yellow-50 text-yellow-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    case "rejected":
      return "bg-red-50 text-red-700";
    case "reserved":
      return "bg-green-50 text-green-700";
    case "checked in":
      return "bg-blue-50 text-blue-700";
    case "checked out":
      return "bg-gray-50 text-gray-700";
    case "no show":
      return "bg-purple-50 text-purple-700";
    default:
      return "bg-gray-50 text-gray-700";
  }
};

/**
 * Calculate the number of days until the next stay
 */
export const calculateDaysUntilNextStay = (
  bookings: any[]
): number | string => {
  if (!bookings || bookings.length === 0) return "N/A";

  const today = new Date();
  const upcomingBookings = bookings
    .filter((booking) => new Date(booking.check_in_date) > today)
    .sort(
      (a, b) =>
        new Date(a.check_in_date).getTime() -
        new Date(b.check_in_date).getTime()
    );

  if (upcomingBookings.length === 0) return "N/A";

  const nextBooking = upcomingBookings[0];
  const nextStayDate = new Date(nextBooking.check_in_date);
  const diffTime = nextStayDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Format time into 12-hour format
 */
export const formatTime = (time: string): string => {
  if (!time) return "";

  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);

  const period = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;

  return `${formattedHour}:${minutes} ${period}`;
};


/**
 * Shows the rendered discounted price if the 
 * area / room has a discount applied.
 * Otherwise, it returns the original price.
 */
export const formatDiscountedPrice = (
  price: number,
  discount: number | null
): string => {
  if (discount && discount > 0) {
    const discountedPrice = price - (price * discount) / 100;
    return pesoFormatter.format(discountedPrice);
  }
  return pesoFormatter.format(price);
}