import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback, useMemo } from "react";
import { fetchBookingDetail } from "../../services/Booking";
import BookingCard from "./BookingCard";
import { formatDate } from "../../utils/formatters";
import { BookingDataProps, BookingDataTypes, FormattedBooking } from "../../types/BookingGuest";
import { formatCurrency } from "../../utils/formatters";

const BookingData = memo(({ bookingId }: BookingDataProps) => {
  const effectiveBookingId = bookingId;

  const { data: bookingData, isLoading, error } = useQuery<BookingDataTypes>({
    queryKey: ['booking', effectiveBookingId],
    queryFn: () => fetchBookingDetail(effectiveBookingId),
    enabled: !!effectiveBookingId,
  });

  const formattedBooking = useMemo(() => {
    if (!effectiveBookingId || !bookingData) return null;

    const isVenueBooking = bookingData?.is_venue_booking || false;
    const result: FormattedBooking = {
      bookingId: bookingData?.id || '',
      status: bookingData?.status || "pending",
      dates: `${formatDate(bookingData?.check_in_date || '').split(',')[0]} - ${formatDate(bookingData?.check_out_date || '').split(',')[0]}`,
      specialRequest: bookingData?.special_request,
      phoneNumber: bookingData?.phone_number,
      bookingDate: bookingData?.created_at ? formatDate(bookingData.created_at) : undefined,
      cancellationReason: bookingData?.cancellation_reason,
      cancellationDate: bookingData?.cancellation_date ? formatDate(bookingData.cancellation_date) : undefined,
      isVenueBooking: isVenueBooking,
      roomType: "",
      imageUrl: "",
      guests: 0,
      price: 0,
      numberOfGuests: bookingData?.number_of_guests || 1,
      arrivalTime: bookingData?.time_of_arrival,
      downPayment: bookingData?.down_payment,
      downPaymentFormatted: formatCurrency(bookingData?.down_payment),
    };

    if (bookingData?.user) {
      result.userDetails = {
        fullName: `${bookingData.user.first_name} ${bookingData.user.last_name}`,
        email: bookingData.user.email,
        phoneNumber: bookingData.phone_number
      };
    }

    if (!isVenueBooking) {
      const roomDetails = bookingData?.room_details || bookingData?.room;
      const roomWithDiscount = roomDetails as (typeof roomDetails & { discount_percent?: number; discounted_price?: number | string });
      result.originalPrice = roomWithDiscount?.room_price ? Number(roomWithDiscount.room_price) : (bookingData?.total_price ?? 0);
      result.discountPercent = roomWithDiscount?.discount_percent ?? 0;
      result.discountedPrice = roomWithDiscount?.discounted_price ? Number(roomWithDiscount.discounted_price) : (bookingData?.total_price ?? 0);
      result.originalPriceFormatted = formatCurrency(result.originalPrice);
      result.discountedPriceFormatted = formatCurrency(result.discountedPrice);
    } else {
      result.originalPrice = bookingData?.total_price ?? 0;
      result.discountPercent = 0;
      result.discountedPrice = bookingData?.total_price ?? 0;
      result.originalPriceFormatted = formatCurrency(result.originalPrice);
      result.discountedPriceFormatted = formatCurrency(result.discountedPrice);
    }

    if (isVenueBooking) {
      const areaData = bookingData?.area_details || bookingData?.area;
      if (areaData) {
        result.roomType = areaData.area_name || "Venue";
        result.imageUrl = areaData.images[0].area_image;
        result.guests = areaData.capacity || 0;
        result.phoneNumber = bookingData?.phone_number;
        result.price = bookingData?.total_price || 0;
        result.totalPrice = bookingData?.total_price;
        result.areaDetails = {
          area_image: areaData.images[0].area_image,
          area_name: areaData.area_name,
          price_per_hour: areaData.price_per_hour,
          capacity: areaData.capacity
        };
      }
    } else {
      const roomData = bookingData?.room || bookingData?.room_details;
      if (roomData) {
        const roomType = roomData.room_name || "Unknown Room";
        result.roomType = roomType;
        result.phoneNumber = bookingData?.phone_number;
        result.imageUrl = roomData.images[0].room_image;
        result.guests = roomData?.max_guests;
        result.price = bookingData?.total_price || 0;
        result.totalPrice = bookingData?.total_price;
        result.roomDetails = {
          room_image: roomData.images[0].room_image,
          capacity: roomData.max_guests,
        }
      }
    }

    if (bookingData?.payment_method) {
      result.paymentProof = bookingData?.payment_proof;
    }

    return result;
  }, [effectiveBookingId, bookingData]);

  const renderLoading = useCallback(() => (
    <motion.div
      className="p-6 space-y-6 flex justify-center items-center min-h-[300px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
      </div>
    </motion.div>
  ), []);

  const renderError = useCallback(() => (
    <motion.div
      className="p-6 text-center text-red-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <p>Error loading booking: {error instanceof Error ? error.message : 'An error occurred'}</p>
    </motion.div>
  ), [error]);

  const renderEmpty = useCallback(() => (
    <motion.div
      className="text-center p-10 bg-white rounded-lg shadow-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {effectiveBookingId ? (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking Not Found</h2>
          <p className="text-gray-600">The booking you're looking for could not be found. Please check the booking ID.</p>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Bookings Found</h2>
          <p className="text-gray-600">You don't have any bookings yet. Start exploring our rooms and book your stay!</p>
        </>
      )}
    </motion.div>
  ), [effectiveBookingId]);

  if (isLoading) return renderLoading();
  if (error) return renderError();
  if (!formattedBooking) return renderEmpty();

  return (
    <AnimatePresence>
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="w-full">
          <BookingCard {...formattedBooking} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

BookingData.displayName = "BookingData";

export default BookingData;